document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM (sin cambios)
    const quadrants = document.querySelectorAll('.quadrant');
    const nameModal = document.getElementById('name-modal');
    const nameModalCloseButton = nameModal.querySelector('.close-name-modal-button');
    const saveNameButton = document.getElementById('save-name-button');
    const nameInput = document.getElementById('name-input');
    const nameList = document.getElementById('name-list');
    const modalTitle = document.getElementById('modal-title');
    
    const confirmModal = document.getElementById('confirm-modal');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    const acceptDeleteButton = document.getElementById('accept-delete-button');
    const nameToDeleteSpan = document.getElementById('name-to-delete');

    const openCircleModalButton = document.getElementById('open-circle-modal-button');
    const circleModal = document.getElementById('circle-modal');
    const circleModalCloseButton = document.querySelector('.close-circle-modal-button');
    const newCircleContainer = document.getElementById('new-circle-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    const downloadButton = document.getElementById('download-button');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const downloadMessage = document.getElementById('download-message');

    let activeQuadrant = '';
    let nameToDelete = { quadrant: null, docId: null, name: null };
    
    // Bandera para controlar la animación
    let isModalOpen = false;

    const quadrantInfo = {
        'top-left': { title: 'Nombres para Cuadrante Azul: <span class="subtitulo-azul">Formales, Precisos, Precavidos, Deliberado, Cuestionado.</span>' },
        'top-right': { title: 'Nombres para Cuadrante Rojo: <span class="subtitulo-rojo">Propositivo, Competitivo, Demandante, Determinado.</span>' },
        'bottom-left': { title: 'Nombres para Cuadrante Amarillo: <span class="subtitulo-amarillo">Comprensivo, Compartido, Alentador, Relajado, Paciente.</span>' },
        'bottom-right': { title: 'Nombres para Cuadrante Verde: <span class="subtitulo-verde">Dinámico, Persuasivo, Entusiasta, Expresivo, Sociable.</span>' }
    };
    
    // Función para animar un solo cuadrante
    function animateQuadrant(quadrant, initialTransform, finalTransform, duration = 600, delay = 100) {
        return new Promise(resolve => {
            if (isModalOpen) {
                quadrant.style.transform = initialTransform;
                quadrant.style.zIndex = '1';
                setTimeout(resolve, delay);
                return;
            }

            quadrant.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
            quadrant.style.zIndex = '10';
            quadrant.style.transform = finalTransform;
            
            setTimeout(() => {
                if (!isModalOpen) {
                    quadrant.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.27, 1.55)`;
                    quadrant.style.zIndex = '1';
                    quadrant.style.transform = initialTransform;
                }
                setTimeout(resolve, delay);
            }, duration);
        });
    }

    // Nueva función para el bucle de animación
    async function startQuadrantAnimation() {
        while (!isModalOpen) {
            await animateQuadrant(document.querySelector('.top-left'), 'translate(-5px, -5px)', 'translate(-10px, -10px) scale(1.1)');
            if (isModalOpen) break;
            await animateQuadrant(document.querySelector('.top-right'), 'translate(5px, -5px)', 'translate(10px, -10px) scale(1.1)');
            if (isModalOpen) break;
            await animateQuadrant(document.querySelector('.bottom-left'), 'translate(-5px, 5px)', 'translate(-10px, 10px) scale(1.1)');
            if (isModalOpen) break;
            await animateQuadrant(document.querySelector('.bottom-right'), 'translate(5px, 5px)', 'translate(10px, 10px) scale(1.1)');
            if (isModalOpen) break;
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa al final del bucle
        }
    }
    
    // --- FUNCIÓN PARA ABRIR CUALQUIER MODAL CON ANIMACIÓN Y AÑADIR AL HISTORIAL ---
    function openModal(modalElement, quadrantOrigin = null) {
        isModalOpen = true; // Establecer la bandera cuando un modal está abierto
        modalElement.style.display = 'block';
        if (modalElement.id === 'circle-modal') {
            document.querySelector('.main-container').classList.add('hidden');
        }
        if (quadrantOrigin) {
            const contentElement = modalElement.querySelector('.modal-content');
            contentElement.classList.add(quadrantOrigin);
        }
        setTimeout(() => {
            modalElement.classList.add('is-active');
            history.pushState({ modalId: modalElement.id }, '', `#${modalElement.id}`);
        }, 10);
    }
    
    // --- FUNCIÓN PARA CERRAR CUALQUIER MODAL CON ANIMACIÓN ---
    function closeModal(modalElement) {
        if (!modalElement.classList.contains('is-active')) {
            return;
        }

        modalElement.classList.remove('is-active');
        const contentElement = modalElement.querySelector('.modal-content');
        
        contentElement.addEventListener('transitionend', function handler() {
            modalElement.style.display = 'none';
            contentElement.classList.remove('top-left-origin', 'top-right-origin', 'bottom-left-origin', 'bottom-right-origin');
            contentElement.removeEventListener('transitionend', handler);
            
            // Si no hay ningún modal abierto, reinicia la animación de los cuadrantes
            if (!document.querySelector('.modal.is-active')) {
                 isModalOpen = false;
                 startQuadrantAnimation();
            }
        });
    }

    // --- Cierre de modales específico ---
    function closeNameModal() {
        closeModal(nameModal);
        
        // Restaurar la posición de los cuadrantes
        quadrants.forEach(quadrant => {
            const type = quadrant.dataset.quadrant;
            quadrant.style.zIndex = '1';
            quadrant.style.opacity = '1';
            quadrant.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55), filter 0.4s ease';

            if (type === 'top-left') {
                quadrant.style.transform = 'translate(-5px, -5px)';
            } else if (type === 'top-right') {
                quadrant.style.transform = 'translate(5px, -5px)';
            } else if (type === 'bottom-left') {
                quadrant.style.transform = 'translate(-5px, 5px)';
            } else if (type === 'bottom-right') {
                quadrant.style.transform = 'translate(5px, 5px)';
            }
        });
    }

    function closeCircleModal() {
        closeModal(circleModal);

        const contentElement = circleModal.querySelector('.modal-content');
        contentElement.addEventListener('transitionend', function handler() {
            newCircleContainer.innerHTML = '';
            loadingSpinner.style.display = 'none';
            newCircleContainer.classList.add('hidden');
            downloadButton.classList.add('hidden');
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            downloadMessage.classList.add('hidden');
            openCircleModalButton.style.display = 'block';
            document.querySelector('.main-container').classList.remove('hidden');
            contentElement.removeEventListener('transitionend', handler);
        });
    }
    
    function closeConfirmModal() {
        closeModal(confirmModal);
        history.back();
    }

    // --- Lógica de eventos para cerrar modales ---
    nameModalCloseButton.addEventListener('click', () => {
        history.back();
    });

    circleModalCloseButton.addEventListener('click', () => {
        history.back();
    });

    // Cierra el modal al presionar la tecla 'Esc'
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const currentModal = document.querySelector('.modal.is-active');
            if (currentModal) {
                history.back();
            }
        }
    });

    // Oyente para el botón de retroceso del navegador
    window.addEventListener('popstate', (event) => {
        const currentModal = document.querySelector('.modal.is-active');
        if (currentModal) {
            if (event.state && currentModal.id === event.state.modalId) {
            } else {
                if (currentModal.id === 'name-modal') {
                    closeNameModal();
                } else if (currentModal.id === 'circle-modal') {
                    closeCircleModal();
                } else if (currentModal.id === 'confirm-modal') {
                    closeConfirmModal();
                }
            }
        }
    });

    openCircleModalButton.addEventListener('click', () => {
        openCircleModalButton.style.display = 'none';
        loadingSpinner.style.display = 'block';
        newCircleContainer.classList.add('hidden');
        downloadButton.classList.add('hidden');
        renderNewCircle();
        openModal(circleModal);
    });

    downloadButton.addEventListener('click', () => {
        downloadButton.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        downloadMessage.classList.remove('hidden');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = progress + '%';
            if (progress >= 95) { 
                clearInterval(interval);
            }
        }, 40);
        
        captureAndDownloadNames('black').then(() => {
            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                downloadMessage.classList.add('hidden');
                downloadButton.classList.remove('hidden');
                progressBar.style.width = '0%';
            }, 500);
        });
    });

    async function getNamesForQuadrant(quadrantName) {
        const names = [];
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const namesCollectionRef = window.collection(window.db, quadrantName);
            const q = window.query(namesCollectionRef, window.orderBy('timestamp', 'asc'));
            const namesSnapshot = await window.getDocs(q);
            namesSnapshot.forEach((doc) => {
                names.push(doc.data().nombre);
            });
        } catch (e) {
            console.error("Error al obtener los nombres: ", e);
        }
        return names;
    }

    async function renderNewCircle() {
        const topLeftNames = await getNamesForQuadrant('top-left');
        const topRightNames = await getNamesForQuadrant('top-right');
        const bottomLeftNames = await getNamesForQuadrant('bottom-left');
        const bottomRightNames = await getNamesForQuadrant('bottom-right');

        const createNameList = (names) => {
            return names.map(name => `<li class="new-quadrant-name">${name}</li>`).join('');
        };

        const circleHTML = `
            <div class="new-circle-container">
                <div class="new-circle">
                    <div class="new-quadrant top-left">
                        <ul class="new-quadrant-name-list">${createNameList(topLeftNames)}</ul>
                    </div>
                    <div class="new-quadrant top-right">
                        <ul class="new-quadrant-name-list">${createNameList(topRightNames)}</ul>
                    </div>
                    <div class="new-quadrant bottom-left">
                        <ul class="new-quadrant-name-list">${createNameList(bottomLeftNames)}</ul>
                    </div>
                    <div class="new-quadrant bottom-right">
                        <ul class="new-quadrant-name-list">${createNameList(bottomRightNames)}</ul>
                    </div>
                </div>
            </div>
        `;
        
        newCircleContainer.innerHTML = circleHTML;
        newCircleContainer.classList.remove('hidden');

        setTimeout(() => {
            loadingSpinner.style.display = 'none';
            downloadButton.classList.remove('hidden');
        }, 150);
    }

    quadrants.forEach(quadrant => {
        quadrant.addEventListener('click', async () => {
            activeQuadrant = quadrant.getAttribute('data-quadrant');
            const quadrantOriginClass = activeQuadrant + '-origin';

            isModalOpen = true; // Pausar la animación cuando se hace clic
            quadrants.forEach(q => {
                const type = q.dataset.quadrant;
                let transformValue = '';
                if (type === 'top-left') {
                    transformValue = 'translate(-200px, -250px) scale(3)';
                } else if (type === 'top-right') {
                    transformValue = 'translate(200px, -250px) scale(3)';
                } else if (type === 'bottom-left') {
                    transformValue = 'translate(-200px, 250px) scale(3)';
                } else if (type === 'bottom-right') {
                    transformValue = 'translate(200px, 250px) scale(3)';
                }
                
                if (q === quadrant) {
                    q.style.transform = transformValue;
                    q.style.zIndex = '10';
                    q.style.opacity = '1';
                } else {
                    q.style.transform = 'translate(0, 0) scale(1)';
                    q.style.zIndex = '1';
                    q.style.opacity = '0';
                }
            });

            modalTitle.innerHTML = quadrantInfo[activeQuadrant].title;
            await displayNames(activeQuadrant);
            openModal(nameModal, quadrantOriginClass);
        });
    });

    nameInput.addEventListener('input', () => {
        if (nameInput.value.trim() !== '') {
            saveNameButton.classList.add('button-ready');
        } else {
            saveNameButton.classList.remove('button-ready');
        }
    });

    saveNameButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (name) {
            await saveName(activeQuadrant, name);
            nameInput.value = '';
            await displayNames(activeQuadrant);

            saveNameButton.classList.remove('button-ready');
            saveNameButton.classList.add('button-active-effect');
            
            setTimeout(() => {
                saveNameButton.classList.remove('button-active-effect');
            }, 1200);
        }
    });

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveNameButton.click();
        }
    });

    acceptDeleteButton.addEventListener('click', async () => {
        if (nameToDelete.quadrant !== null && nameToDelete.docId !== null) {
            await deleteName(nameToDelete.quadrant, nameToDelete.docId);
            closeConfirmModal();
        }
    });

    cancelDeleteButton.addEventListener('click', () => {
        closeConfirmModal();
    });
    
    async function saveName(quadrant, name) {
        try {
            const namesCollectionRef = window.collection(window.db, quadrant);
            await window.addDoc(namesCollectionRef, {
                nombre: name,
                timestamp: new Date()
            });
            console.log("Nombre guardado en Firestore!");
        } catch (e) {
            console.error("Error al guardar el nombre: ", e);
        }
    }

    async function displayNames(quadrant) {
        nameList.innerHTML = '';
        try {
            const namesCollectionRef = window.collection(window.db, quadrant);
            const q = window.query(namesCollectionRef, window.orderBy('timestamp', 'asc'));
            const namesSnapshot = await window.getDocs(q);
            namesSnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                li.textContent = data.nombre;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '×';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    nameToDelete.quadrant = quadrant;
                    nameToDelete.docId = doc.id;
                    nameToDeleteSpan.textContent = data.nombre;
                    openModal(confirmModal);
                });
                li.appendChild(deleteButton);
                nameList.appendChild(li);
            });
        } catch (e) {
            console.error("Error al obtener los nombres: ", e);
        }
    }

    async function deleteName(quadrant, docId) {
        try {
            const nameDocRef = window.doc(window.db, quadrant, docId);
            await window.deleteDoc(nameDocRef);
            console.log("Nombre eliminado con éxito!");
            await displayNames(quadrant);
        } catch (e) {
            console.error("Error al eliminar el nombre: ", e);
        }
    }
    
    async function captureAndDownloadNames(bgColor) {
        const topLeftNames = await getNamesForQuadrant('top-left');
        const topRightNames = await getNamesForQuadrant('top-right');
        const bottomLeftNames = await getNamesForQuadrant('bottom-left');
        const bottomRightNames = await getNamesForQuadrant('bottom-right');

        const createNameList = (names, color) => {
            return names.map(name => `<li style="font-size: 24px; line-height: 1.0; margin: 2px 0; font-weight: 300; color: ${color};">${name}</li>`).join('');
        };
        
        const tempSquare = document.createElement('div');
        tempSquare.style.width = '600px';
        tempSquare.style.height = '600px';
        tempSquare.style.display = 'flex';
        tempSquare.style.flexWrap = 'wrap';
        tempSquare.style.fontFamily = 'Poppins, sans-serif';

        const quadrantStyle = 'width: 50%; height: 50%; display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 20px; box-sizing: border-box; text-align: center;';

        tempSquare.innerHTML = `
            <div style="${quadrantStyle} background-color: #5CA5BB;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(topLeftNames, '#FFFFFF')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #C94C69;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(topRightNames, '#FFFFFF')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #D5D968;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: ${bgColor === 'black' ? '#FFFFFF' : '#171717'};">${createNameList(bottomLeftNames, bgColor === 'black' ? '#FFFFFF' : '#171717')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #63C963;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(bottomRightNames, '#FFFFFF')}</ul>
            </div>
        `;
        
        const tempCircleContainer = document.createElement('div');
        tempCircleContainer.style.width = '600px';
        tempCircleContainer.style.height = '600px';
        tempCircleContainer.style.borderRadius = '50%';
        tempCircleContainer.style.overflow = 'hidden';
        
        if (bgColor) {
            tempCircleContainer.style.backgroundColor = bgColor;
        } else {
            tempCircleContainer.style.backgroundColor = 'transparent';
        }

        tempCircleContainer.style.position = 'fixed';
        tempCircleContainer.style.top = '-9999px';

        tempCircleContainer.appendChild(tempSquare);
        document.body.appendChild(tempCircleContainer);

        return html2canvas(tempCircleContainer, {
            scale: 2,
            backgroundColor: bgColor 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'cuadrantes.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            tempCircleContainer.remove();
        });
    }

    startQuadrantAnimation(); // Inicia la animación al cargar la página
});
