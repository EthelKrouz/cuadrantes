document.addEventListener('DOMContentLoaded', () => {
    const quadrants = document.querySelectorAll('.quadrant');
    const modal = document.getElementById('name-modal');
    const closeModalButton = document.querySelector('.close-button');
    const saveNameButton = document.getElementById('save-name-button');
    const nameInput = document.getElementById('name-input');
    const nameList = document.getElementById('name-list');
    const modalTitle = document.getElementById('modal-title');
    
    const confirmModal = document.getElementById('confirm-modal');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    const acceptDeleteButton = document.getElementById('accept-delete-button');
    const nameToDeleteSpan = document.getElementById('name-to-delete');

    let activeQuadrant = '';
    let nameToDelete = { quadrant: null, docId: null, name: null };

    const quadrantInfo = {
        'top-left': { title: 'Nombres para Cuadrante Azul: <span class="subtitulo-azul">Formales, Precisos, Precavidos, Deliverado, Cuestionado.</span>' },
        'top-right': { title: 'Nombres para Cuadrante Rojo: <span class="subtitulo-rojo">Propositivo, Competitivo, Demandante, Determinado.</span>' },
        'bottom-left': { title: 'Nombres para Cuadrante Amarillo: <span class="subtitulo-amarillo">Comprensivo, Compartido, Alentador, Relajado, Paciente.</span>' },
        'bottom-right': { title: 'Nombres para Cuadrante Verde: <span class="subtitulo-verde">Dinámico, Persuasivo, Entusiasta, Expresivo, Sociable.</span>' }
    };

    quadrants.forEach(quadrant => {
        quadrant.addEventListener('click', async () => {
            activeQuadrant = quadrant.getAttribute('data-quadrant');

            quadrants.forEach(q => {
                const type = q.dataset.quadrant;
                let transformValue = '';
                
                if (type === 'top-left') {
                    transformValue = 'translate(-200px, -200px) scale(3)';
                } else if (type === 'top-right') {
                    transformValue = 'translate(200px, -200px) scale(3)';
                } else if (type === 'bottom-left') {
                    transformValue = 'translate(-200px, 200px) scale(3)';
                } else if (type === 'bottom-right') {
                    transformValue = 'translate(200px, 200px) scale(3)';
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
            await displayNames(activeQuadrant); // Llama a la función asíncrona
            modal.style.display = 'block';
        });
    });

    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
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
        if (event.target === modal) {
            modal.style.display = 'none';
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


    // --- NUEVAS FUNCIONES PARA FIREBASE ---

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
});
