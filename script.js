document.addEventListener('DOMContentLoaded', function() {
    // Variables del DOM - Se obtienen una sola vez
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

    const saveNotification = document.getElementById('notification-message');
    const deleteNotification = document.getElementById('delete-notification-message');

    const pageContent = document.querySelector('.page-content');
    const headerContent = document.querySelector('.header-content');

    // Variables de estado
    let activeQuadrant = '';
    let nameToDelete = { quadrant: null, docId: null, name: null };
    let isModalOpen = false;
    let isLoading = false;
    let isDownloading = false;

    // Cache de datos
    const quadrantData = {
        'top-left': [],
        'top-right': [],
        'bottom-left': [],
        'bottom-right': []
    };
    let isDataLoaded = false;
    let dataLoadingPromise;

    const quadrantInfo = {
        'top-left': { title: 'Nombres para Cuadrante Azul: <span class="subtitulo-azul">Formales, Precisos, Precavidos, Deliberado, Cuestionado.</span>' },
        'top-right': { title: 'Nombres para Cuadrante Rojo: <span class="subtitulo-rojo">Propositivo, Competitivo, Demandante, Determinado.</span>' },
        'bottom-left': { title: 'Nombres para Cuadrante Verde: <span class="subtitulo-verde">Comprensivo, Compartido, Alentador, Relajado, Paciente.</span>' },
        'bottom-right': { title: 'Nombres para Cuadrante Amarillo: <span class="subtitulo-amarillo">Dinámico, Persuasivo, Entusiasta, Expresivo, Sociable.</span>' }
    };

    // Funciones de utilidad
    function showNotification(element, message, isError = false) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.classList.toggle('error', isError);
        
        setTimeout(() => { element.classList.add('visible'); }, 10);
        setTimeout(() => {
            element.classList.remove('visible');
            setTimeout(() => { element.classList.add('hidden'); }, 500);
        }, 3000);
    }
    
    function showNameModalNotification(message, isError = false) {
        showNotification(saveNotification, message, isError);
    }

    function openModal(modalElement) {
        isModalOpen = true; 
        modalElement.classList.add('show');
        pageContent.classList.add('blur-background');

        headerContent.classList.add('hidden-transition');
        openCircleModalButton.classList.add('hidden-transition');

        if (modalElement.id === 'circle-modal') {
            document.querySelector('.main-container').classList.add('hidden');
        }
        
        setTimeout(() => {
            history.pushState({ modalId: modalElement.id }, '', `#${modalElement.id}`);
        }, 10);
    }
    
    function closeModal(modalElement) {
        modalElement.classList.remove('show');
    }

    function restorePageElements() {
        headerContent.classList.remove('hidden-transition');
        openCircleModalButton.classList.remove('hidden-transition');
        pageContent.classList.remove('blur-background'); 
        isModalOpen = false;
    }

    function closeNameModal() {
        closeModal(nameModal);
        restorePageElements();
        
        quadrants.forEach(q => {
            const type = q.dataset.quadrant;
            q.style.zIndex = '1';
            q.style.opacity = '1';
            q.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55), filter 0.4s ease';
            q.style.transform = type === 'top-left' ? 'translate(-5px, -5px)' :
                                type === 'top-right' ? 'translate(5px, -5px)' :
                                type === 'bottom-left' ? 'translate(-5px, 5px)' :
                                'translate(5px, 5px)';
        });
    }
    
    function closeCircleModal() {
        closeModal(circleModal);
        restorePageElements();
        
        setTimeout(() => {
            newCircleContainer.innerHTML = '';
            loadingSpinner.style.display = 'none';
            newCircleContainer.classList.add('hidden');
            downloadButton.classList.add('hidden');
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            
            document.querySelector('.main-container').classList.remove('hidden');
        }, 500);
    }
    
    function closeConfirmModal() {
        closeModal(confirmModal);
        history.back();
    }

    // Funciones de Firebase y manejo de datos
    async function getNamesForQuadrant(quadrantName) {
        const names = [];
        try {
            const namesCollectionRef = window.collection(window.db, quadrantName);
            const q = window.query(namesCollectionRef, window.orderBy('timestamp', 'asc'));
            const namesSnapshot = await window.getDocs(q);
            namesSnapshot.forEach(doc => {
                names.push({ id: doc.id, nombre: doc.data().nombre });
            });
            quadrantData[quadrantName] = names;
        } catch (e) {
            console.error("Error al obtener los nombres: ", e);
            throw e;
        }
    }
    
    // Función optimizada para actualizar el DOM
    function updateNameList(quadrant) {
        const currentNames = quadrantData[quadrant];
        nameList.innerHTML = '';
        currentNames.forEach(data => {
            const li = document.createElement('li');
            li.textContent = data.nombre;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                nameToDelete.quadrant = quadrant;
                nameToDelete.docId = data.id;
                nameToDelete.name = data.nombre;
                nameToDeleteSpan.textContent = data.nombre;
                openModal(confirmModal);
            });
            li.appendChild(deleteButton);
            nameList.appendChild(li);
        });
    }

    async function saveName(quadrant, name) {
        try {
            const namesCollectionRef = window.collection(window.db, quadrant);
            const docRef = await window.addDoc(namesCollectionRef, {
                nombre: name,
                timestamp: new Date()
            });
            console.log("Nombre guardado en Firestore!");
            quadrantData[quadrant].push({ id: docRef.id, nombre: name });
        } catch (e) {
            console.error("Error al guardar el nombre: ", e);
            throw e;
        }
    }

    async function deleteName(quadrant, docId) {
        try {
            const nameDocRef = window.doc(window.db, quadrant, docId);
            await window.deleteDoc(nameDocRef);
            console.log("Nombre eliminado con éxito!");
            quadrantData[quadrant] = quadrantData[quadrant].filter(item => item.id !== docId);
        } catch (e) {
            console.error("Error al eliminar el nombre: ", e);
            throw e;
        }
    }

    // Funciones de renderizado para los modals
    function renderNewCircle() {
        const createNameList = (names) => names.map(name => `<li class="new-quadrant-name">${name.nombre}</li>`).join('');
        
        const circleHTML = `
            <div class="new-circle-container">
                <div class="new-circle">
                    <div class="new-quadrant top-left"><ul class="new-quadrant-name-list">${createNameList(quadrantData['top-left'])}</ul></div>
                    <div class="new-quadrant top-right"><ul class="new-quadrant-name-list">${createNameList(quadrantData['top-right'])}</ul></div>
                    <div class="new-quadrant bottom-left"><ul class="new-quadrant-name-list">${createNameList(quadrantData['bottom-left'])}</ul></div>
                    <div class="new-quadrant bottom-right"><ul class="new-quadrant-name-list">${createNameList(quadrantData['bottom-right'])}</ul></div>
                </div>
            </div>
        `;
        
        newCircleContainer.innerHTML = circleHTML;
        newCircleContainer.classList.remove('hidden');
        loadingSpinner.style.display = 'none';
        downloadButton.classList.remove('hidden');
        circleModalCloseButton.classList.remove('hidden');
    }

    async function captureAndDownloadNames(bgColor) {
        const createNameList = (names, color) => names.map(name => `<li style="font-size: 24px; line-height: 1.0; margin: 2px 0; font-weight: 300; color: ${color};">${name.nombre}</li>`).join('');
        
        const tempCircleContainer = document.createElement('div');
        Object.assign(tempCircleContainer.style, {
            width: '600px', height: '600px', borderRadius: '50%', overflow: 'hidden',
            position: 'fixed', top: '-9999px', backgroundColor: bgColor, fontFamily: 'Poppins, sans-serif'
        });

        const quadrantStyle = 'width: 50%; height: 50%; display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 10px; box-sizing: border-box; text-align: center;';
        
        const quadrantHTML = `
            <div style="display: flex; flex-wrap: wrap; width: 100%; height: 100%;">
                <div style="${quadrantStyle} background-color: #5CA5BB;">
                    <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(quadrantData['top-left'], '#FFFFFF')}</ul>
                </div>
                <div style="${quadrantStyle} background-color: #C94C69;">
                    <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(quadrantData['top-right'], '#FFFFFF')}</ul>
                </div>
                <div style="${quadrantStyle} background-color: #63C963;">
                    <ul style="list-style-type: none; padding: 0; margin: 0; color: ${bgColor === 'black' ? '#FFFFFF' : '#171717'};">${createNameList(quadrantData['bottom-left'], bgColor === 'black' ? '#FFFFFF' : '#171717')}</ul>
                </div>
                <div style="${quadrantStyle} background-color: #D5D968;">
                    <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(quadrantData['bottom-right'], '#FFFFFF')}</ul>
                </div>
            </div>
        `;
        
        tempCircleContainer.innerHTML = quadrantHTML;
        document.body.appendChild(tempCircleContainer);

        try {
            const canvas = await html2canvas(tempCircleContainer, { scale: 8, backgroundColor: bgColor });
            const link = document.createElement('a');
            link.download = 'cuadrantes.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            tempCircleContainer.remove();
        }
    }

    // Manejadores de eventos
    quadrants.forEach(quadrant => {
        quadrant.addEventListener('click', async () => {
            activeQuadrant = quadrant.dataset.quadrant;
            
            if (!quadrantData[activeQuadrant] || quadrantData[activeQuadrant].length === 0) {
                 await getNamesForQuadrant(activeQuadrant);
            }
            
            quadrants.forEach(q => {
                const type = q.dataset.quadrant;
                const transformValue = type === 'top-left' ? 'translate(-200px, -250px) scale(3)' :
                                     type === 'top-right' ? 'translate(200px, -250px) scale(3)' :
                                     type === 'bottom-left' ? 'translate(-200px, 250px) scale(3)' :
                                     'translate(200px, 250px) scale(3)';
                
                q.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s ease';
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
            
            headerContent.classList.add('hidden-transition');
            openCircleModalButton.classList.add('hidden-transition');

            modalTitle.innerHTML = quadrantInfo[activeQuadrant].title;
            updateNameList(activeQuadrant);
            openModal(nameModal);
        });
    });

    nameInput.addEventListener('input', () => {
        saveNameButton.classList.toggle('button-ready', nameInput.value.trim() !== '');
    });

    saveNameButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (name) {
            saveNameButton.classList.add('saving');
            saveNameButton.disabled = true;

            try {
                await saveName(activeQuadrant, name);
                showNameModalNotification("¡Nombre guardado con éxito!");
            } catch (error) {
                showNameModalNotification("Error al guardar. Inténtalo de nuevo.", true);
                console.error("Error al guardar el nombre:", error);
            }

            nameInput.value = '';
            updateNameList(activeQuadrant);

            setTimeout(() => {
                saveNameButton.classList.remove('saving');
                saveNameButton.classList.remove('button-ready');
                saveNameButton.disabled = false;
            }, 700);
        }
    });

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveNameButton.click();
    });

    acceptDeleteButton.addEventListener('click', async () => {
        if (nameToDelete.quadrant && nameToDelete.docId) {
            try {
                await deleteName(nameToDelete.quadrant, nameToDelete.docId);
                showNameModalNotification("El nombre ha sido eliminado.");
                updateNameList(nameToDelete.quadrant);
                closeConfirmModal();
            } catch (error) {
                showNotification(deleteNotification, "Error al eliminar. Inténtalo de nuevo.", true);
                console.error("Error al eliminar el nombre:", error);
            }
        }
    });

    cancelDeleteButton.addEventListener('click', closeConfirmModal);

    circleModalCloseButton.addEventListener('click', () => {
        if (isLoading) return; 
        history.back();
    });

    nameModalCloseButton.addEventListener('click', () => history.back());

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const currentModal = document.querySelector('.modal.show');
            if (currentModal && currentModal.id === 'circle-modal' && isLoading) return;
            if (currentModal) history.back();
        }
    });

    window.addEventListener('popstate', (event) => {
        const currentModal = document.querySelector('.modal.show');
        if (!currentModal) return;

        if (currentModal.id === 'circle-modal' && isLoading) {
            if (event.state && currentModal.id === event.state.modalId) return;
            history.pushState({ modalId: currentModal.id }, '', `#${currentModal.id}`);
            return;
        }
        
        if (event.state && currentModal.id === event.state.modalId) return;
        
        if (currentModal.id === 'name-modal') closeNameModal();
        else if (currentModal.id === 'circle-modal') closeCircleModal();
        else if (currentModal.id === 'confirm-modal') closeConfirmModal();
    });

    openCircleModalButton.addEventListener('click', async () => {
        openCircleModalButton.classList.add('hidden-transition');
        headerContent.classList.add('hidden-transition');
        openModal(circleModal);

        isLoading = true; 
        loadingSpinner.style.display = 'block';
        newCircleContainer.innerHTML = '';
        newCircleContainer.classList.add('hidden');
        downloadButton.classList.add('hidden');
        circleModalCloseButton.classList.add('hidden');

        await dataLoadingPromise;

        loadingSpinner.style.display = 'none';
        renderNewCircle();

        isLoading = false; 
    });

    downloadButton.addEventListener('click', async () => {
        if (isDownloading) return; 
        isDownloading = true;

        downloadButton.classList.add('hidden');
        progressContainer.classList.remove('hidden');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressBar.style.width = `${progress}%`;
            if (progress >= 95) clearInterval(interval);
        }, 20); 
        
        setTimeout(async () => {
            await captureAndDownloadNames('black');
            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                downloadButton.classList.remove('hidden');
                progressBar.style.width = '0%';
                isDownloading = false;
            }, 500);
        }, 2000); 
    });

    const preloadData = async () => {
        dataLoadingPromise = Promise.all([
            getNamesForQuadrant('top-left'),
            getNamesForQuadrant('top-right'),
            getNamesForQuadrant('bottom-left'),
            getNamesForQuadrant('bottom-right')
        ]);
        await dataLoadingPromise;
        isDataLoaded = true;
        console.log("Datos de cuadrantes precargados en la caché.");
    };

    preloadData();
});
