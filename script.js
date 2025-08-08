document.addEventListener('DOMContentLoaded', () => {
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

    let activeQuadrant = '';
    let nameToDelete = { quadrant: null, docId: null, name: null };

    const quadrantInfo = {
        'top-left': { title: 'Nombres para Cuadrante Azul: <span class="subtitulo-azul">Formales, Precisos, Precavidos, Deliberado, Cuestionado.</span>' },
        'top-right': { title: 'Nombres para Cuadrante Rojo: <span class="subtitulo-rojo">Propositivo, Competitivo, Demandante, Determinado.</span>' },
        'bottom-left': { title: 'Nombres para Cuadrante Amarillo: <span class="subtitulo-amarillo">Comprensivo, Compartido, Alentador, Relajado, Paciente.</span>' },
        'bottom-right': { title: 'Nombres para Cuadrante Verde: <span class="subtitulo-verde">Dinámico, Persuasivo, Entusiasta, Expresivo, Sociable.</span>' }
    };
    
    // --- FUNCIÓN PARA OCULTAR Y CERRAR LA MODAL DEL CÍRCULO ---
    function closeCircleModal() {
        circleModal.style.display = 'none';
        newCircleContainer.innerHTML = '';
        loadingSpinner.style.display = 'none';
        newCircleContainer.classList.add('hidden');
        downloadButton.classList.add('hidden');
        openCircleModalButton.style.display = 'block';
    }

    // --- FUNCIÓN PARA MOSTRAR EL BOTÓN DE DESCARGA ---
    function showDownloadButton() {
        downloadButton.classList.remove('hidden');
    }

    // --- Lógica del nuevo botón y la modal del círculo ---
    openCircleModalButton.addEventListener('click', () => {
        openCircleModalButton.style.display = 'none';
        circleModal.style.display = 'block';
        loadingSpinner.style.display = 'block';
        newCircleContainer.classList.add('hidden');
        downloadButton.classList.add('hidden');
        renderNewCircle();
    });

    circleModalCloseButton.addEventListener('click', () => {
        closeCircleModal();
    });

    // --- Lógica del botón de descarga para generar la imagen ---
    downloadButton.addEventListener('click', () => {
        captureAndDownloadNames();
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
        loadingSpinner.style.display = 'none';
        newCircleContainer.classList.remove('hidden');
        showDownloadButton();
    }

    // --- Lógica del círculo principal (sin cambios) ---
    quadrants.forEach(quadrant => {
        quadrant.addEventListener('click', async () => {
            activeQuadrant = quadrant.getAttribute('data-quadrant');
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
            nameModal.style.display = 'block';
        });
    });

    nameModalCloseButton.addEventListener('click', () => {
        nameModal.style.display = 'none';
        nameInput.value = '';
        nameInput.blur(); 
        
        quadrants.forEach(quadrant => {
            const type = quadrant.dataset.quadrant;
            quadrant.style.zIndex = '1';
            quadrant.style.opacity = '1';
            
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
    });

    window.addEventListener('click', (event) => {
        if (event.target === nameModal) {
            nameModal.style.display = 'none';
            nameInput.value = '';
            nameInput.blur(); 

            quadrants.forEach(quadrant => {
                const type = quadrant.dataset.quadrant;
                quadrant.style.zIndex = '1';
                quadrant.style.opacity = '1';
                
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
            confirmModal.style.display = 'none';
        }
    });

    cancelDeleteButton.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
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
                    confirmModal.style.display = 'block';
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
            displayNames(quadrant);
        } catch (e) {
            console.error("Error al eliminar el nombre: ", e);
        }
    }
    
    // --- FUNCIÓN PARA CAPTURAR Y DESCARGAR LA IMAGEN DEL CÍRCULO ---
    async function captureAndDownloadNames() {
        downloadButton.style.display = 'none';
        loadingSpinner.style.display = 'block';

        const topLeftNames = await getNamesForQuadrant('top-left');
        const topRightNames = await getNamesForQuadrant('top-right');
        const bottomLeftNames = await getNamesForQuadrant('bottom-left');
        const bottomRightNames = await getNamesForQuadrant('bottom-right');

        const createNameList = (names, color) => {
            return names.map(name => `<li style="font-size: 24px; line-height: 1.0; margin: 2px 0; font-weight: 300; color: ${color};">${name}</li>`).join('');
        };
        
        // Contenedor temporal para los cuadrantes (un cuadrado que luego será un círculo).
        const tempSquare = document.createElement('div');
        tempSquare.style.width = '600px';
        tempSquare.style.height = '600px';
        tempSquare.style.display = 'flex';
        tempSquare.style.flexWrap = 'wrap';
        tempSquare.style.fontFamily = 'Poppins, sans-serif';

        // Estilos para cada cuadrante.
        const quadrantStyle = 'width: 50%; height: 50%; display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 20px; box-sizing: border-box; text-align: center;';

        tempSquare.innerHTML = `
            <div style="${quadrantStyle} background-color: #5CA5BB;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(topLeftNames, '#FFFFFF')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #C94C69;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(topRightNames, '#FFFFFF')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #D5D968;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #171717;">${createNameList(bottomLeftNames, '#171717')}</ul>
            </div>
            <div style="${quadrantStyle} background-color: #63C963;">
                <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">${createNameList(bottomRightNames, '#FFFFFF')}</ul>
            </div>
        `;
        
        // Creamos un contenedor circular que contendrá al cuadrado temporal.
        const tempCircleContainer = document.createElement('div');
        tempCircleContainer.style.width = '600px';
        tempCircleContainer.style.height = '600px';
        tempCircleContainer.style.borderRadius = '50%';
        tempCircleContainer.style.overflow = 'hidden';
        tempCircleContainer.style.backgroundColor = '#171717'; // Fondo oscuro si es necesario
        tempCircleContainer.style.position = 'fixed';
        tempCircleContainer.style.top = '-9999px';

        // Agregamos el cuadrado dentro del contenedor circular.
        tempCircleContainer.appendChild(tempSquare);
        document.body.appendChild(tempCircleContainer);

        // html2canvas ahora capturará el contenedor circular.
        html2canvas(tempCircleContainer, {
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'cuadrantes.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            tempCircleContainer.remove();
            loadingSpinner.style.display = 'none';

            setTimeout(() => {
                 downloadButton.style.display = 'block';
            }, 500);
        });
    }
});
