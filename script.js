document.addEventListener('DOMContentLoaded', function() {
    var quadrants = document.querySelectorAll('.quadrant');
    var nameModal = document.getElementById('name-modal');
    var nameModalCloseButton = nameModal.querySelector('.close-name-modal-button');
    var saveNameButton = document.getElementById('save-name-button');
    var nameInput = document.getElementById('name-input');
    var nameList = document.getElementById('name-list');
    var modalTitle = document.getElementById('modal-title');
    
    var confirmModal = document.getElementById('confirm-modal');
    var cancelDeleteButton = document.getElementById('cancel-delete-button');
    var acceptDeleteButton = document.getElementById('accept-delete-button');
    var nameToDeleteSpan = document.getElementById('name-to-delete');

    var openCircleModalButton = document.getElementById('open-circle-modal-button');
    var circleModal = document.getElementById('circle-modal');
    var circleModalCloseButton = document.querySelector('.close-circle-modal-button');
    var newCircleContainer = document.getElementById('new-circle-container');
    var loadingSpinner = document.getElementById('loading-spinner');

    var downloadButton = document.getElementById('download-button');
    var progressContainer = document.getElementById('progress-container');
    var progressBar = document.getElementById('progress-bar');
    var downloadMessage = document.getElementById('download-message');

    var saveNotification = document.getElementById('notification-message');
    var deleteNotification = document.getElementById('delete-notification-message');

    var pageContent = document.querySelector('.page-content');
    
    // NUEVAS VARIABLES
    var headerContent = document.querySelector('.header-content');

    var activeQuadrant = '';
    var nameToDelete = { quadrant: null, docId: null, name: null };
    var isModalOpen = false;
    var isLoading = false; 

    var quadrantData = {};
    var isDataLoaded = false;
    var dataLoadingPromise;

    var quadrantInfo = {
        'top-left': { title: 'Nombres para Cuadrante Azul: <span class="subtitulo-azul">Formales, Precisos, Precavidos, Deliberado, Cuestionado.</span>' },
        'top-right': { title: 'Nombres para Cuadrante Rojo: <span class="subtitulo-rojo">Propositivo, Competitivo, Demandante, Determinado.</span>' },
        'bottom-left': { title: 'Nombres para Cuadrante Verde: <span class="subtitulo-verde">Comprensivo, Compartido, Alentador, Relajado, Paciente.</span>' },
        'bottom-right': { title: 'Nombres para Cuadrante Amarillo: <span class="subtitulo-amarillo">Dinámico, Persuasivo, Entusiasta, Expresivo, Sociable.</span>' }
    };

    function showNotification(element, message, isError = false) {
        element.textContent = message;
        element.classList.remove('hidden');
        if (isError) {
            element.classList.add('error');
        } else {
            element.classList.remove('error');
        }
        setTimeout(() => {
            element.classList.add('visible');
        }, 10);

        setTimeout(() => {
            element.classList.remove('visible');
            setTimeout(() => {
                element.classList.add('hidden');
            }, 500);
        }, 3000);
    }
    
    function showNameModalNotification(message, isError = false) {
        showNotification(saveNotification, message, isError);
    }

    function animateQuadrant(quadrant, initialTransform, finalTransform) {
        return new Promise(function(resolve) {
            quadrant.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
            quadrant.style.zIndex = '10';
            quadrant.style.transform = finalTransform;
            
            setTimeout(function() {
                if (!isModalOpen) {
                    quadrant.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                    quadrant.style.zIndex = '1';
                    quadrant.style.transform = initialTransform;
                }
                setTimeout(resolve, 600);
            }, 600);
        });
    }

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
            
            await new Promise(function(resolve) { setTimeout(resolve, 500); }); 
        }
    }
    
    function openModal(modalElement) {
        isModalOpen = true; 
        modalElement.classList.add('show');
        pageContent.classList.add('blur-background');

        // Ocultar y desplazar el título, subtítulo y el botón
        headerContent.classList.add('hidden-transition');
        openCircleModalButton.classList.add('hidden-transition');

        if (modalElement.id === 'circle-modal') {
            document.querySelector('.main-container').classList.add('hidden');
        }
        
        setTimeout(function() {
            history.pushState({ modalId: modalElement.id }, '', '#' + modalElement.id);
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
        startQuadrantAnimation();
    }

    function closeNameModal() {
        closeModal(nameModal);
        // Solo restaurar los elementos de la página si no hay otros modales abiertos
        if (!document.querySelector('.modal.show')) {
            restorePageElements();
        }
        
        quadrants.forEach(function(quadrant) {
            var type = quadrant.dataset.quadrant;
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
        if (!document.querySelector('.modal.show')) {
            restorePageElements();
        }
        
        setTimeout(function() {
            newCircleContainer.innerHTML = '';
            loadingSpinner.style.display = 'none';
            newCircleContainer.classList.add('hidden');
            downloadButton.classList.add('hidden');
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
            downloadMessage.classList.add('hidden');
            
            // Remueve la clase para la transición de aparición
            openCircleModalButton.classList.remove('hidden-button');
            // Restablece la transformación para que la transición funcione correctamente
            openCircleModalButton.style.transform = ''; 
            
            document.querySelector('.main-container').classList.remove('hidden');
        }, 500); // 500ms para que coincida con la duración de la transición
    }
    
    function closeConfirmModal() {
        closeModal(confirmModal);
        history.back();
    }

    circleModalCloseButton.addEventListener('click', function() {
        if (isLoading) return; 
        history.back();
    });

    nameModalCloseButton.addEventListener('click', function() {
        history.back();
    });

    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var currentModal = document.querySelector('.modal.show');
            if (currentModal && currentModal.id === 'circle-modal' && isLoading) {
                return;
            }
            if (currentModal) {
                history.back();
            }
        }
    });

    window.addEventListener('popstate', function(event) {
        var currentModal = document.querySelector('.modal.show');
        if (currentModal) {
            if (currentModal.id === 'circle-modal' && isLoading) {
                if (event.state && currentModal.id === event.state.modalId) {
                    return;
                }
                history.pushState({ modalId: currentModal.id }, '', '#' + currentModal.id);
                return;
            }
            
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

    openCircleModalButton.addEventListener('click', async function() {
        // Añade la clase para la transición de ocultar
        openCircleModalButton.classList.add('hidden-button');
        
        isLoading = true; 
        loadingSpinner.style.display = 'block';
        newCircleContainer.classList.add('hidden');
        downloadButton.classList.add('hidden');
        
        circleModalCloseButton.classList.add('hidden');

        openModal(circleModal);

        if (!isDataLoaded) {
            await dataLoadingPromise;
        }

        setTimeout(function() {
            renderNewCircle();
        }, 2000); 
    });

    var isDownloading = false;
    downloadButton.addEventListener('click', async function() {
        if (isDownloading) return; 

        isDownloading = true;
        downloadButton.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        downloadMessage.classList.remove('hidden');

        var progress = 0;
        var interval = setInterval(function() {
            progress += 1;
            progressBar.style.width = progress + '%';
            if (progress >= 95) { 
                clearInterval(interval);
            }
        }, 20); 
        
        setTimeout(async function() {
            await captureAndDownloadNames('black');
            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(function() {
                progressContainer.classList.add('hidden');
                downloadMessage.classList.add('hidden');
                downloadButton.classList.remove('hidden');
                progressBar.style.width = '0%';
                isDownloading = false; 
            }, 500);
        }, 2000); 
    });

    async function getNamesForQuadrant(quadrantName) {
        return new Promise(async function(resolve, reject) {
            var names = [];
            try {
                var namesCollectionRef = window.collection(window.db, quadrantName);
                var q = window.query(namesCollectionRef, window.orderBy('timestamp', 'asc'));
                var namesSnapshot = await window.getDocs(q);
                namesSnapshot.forEach(function(doc) {
                    names.push({ id: doc.id, nombre: doc.data().nombre });
                });
                quadrantData[quadrantName] = names; 
                resolve(names);
            } catch (e) {
                console.error("Error al obtener los nombres: ", e);
                reject(e);
            }
        });
    }

    function renderNewCircle() {
        var topLeftNames = quadrantData['top-left'];
        var topRightNames = quadrantData['top-right'];
        var bottomLeftNames = quadrantData['bottom-left'];
        var bottomRightNames = quadrantData['bottom-right'];

        function createNameList(names) {
            return names.map(function(name) {
                return '<li class="new-quadrant-name">' + name.nombre + '</li>';
            }).join('');
        };

        var circleHTML = ' <div class="new-circle-container"> <div class="new-circle"> <div class="new-quadrant top-left"> <ul class="new-quadrant-name-list">' + createNameList(topLeftNames) + '</ul> </div> <div class="new-quadrant top-right"> <ul class="new-quadrant-name-list">' + createNameList(topRightNames) + '</ul> </div> <div class="new-quadrant bottom-left"> <ul class="new-quadrant-name-list">' + createNameList(bottomLeftNames) + '</ul> </div> <div class="new-quadrant bottom-right"> <ul class="new-quadrant-name-list">' + createNameList(bottomRightNames) + '</ul> </div> </div> </div> ';
        
        newCircleContainer.innerHTML = circleHTML;
        newCircleContainer.classList.remove('hidden');
        
        loadingSpinner.style.display = 'none';
        downloadButton.classList.remove('hidden');
        
        circleModalCloseButton.classList.remove('hidden');
        isLoading = false; 
    }

    quadrants.forEach(function(quadrant) {
        quadrant.addEventListener('click', async function() {
            activeQuadrant = quadrant.getAttribute('data-quadrant');
            
            await getNamesForQuadrant(activeQuadrant); 

            isModalOpen = true; 
            quadrants.forEach(function(q) {
                var type = q.dataset.quadrant;
                var transformValue = '';
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
            
            // Ocultar y desplazar el título, subtítulo y el botón
            headerContent.classList.add('hidden-transition');
            openCircleModalButton.classList.add('hidden-transition');

            modalTitle.innerHTML = quadrantInfo[activeQuadrant].title;
            await displayNames(activeQuadrant);
            openModal(nameModal);
        });
    });

    nameInput.addEventListener('input', function() {
        if (nameInput.value.trim() !== '') {
            saveNameButton.classList.add('button-ready');
        } else {
            saveNameButton.classList.remove('button-ready');
        }
    });

    saveNameButton.addEventListener('click', async function() {
        var name = nameInput.value.trim();
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
            
            await getNamesForQuadrant(activeQuadrant);
            await displayNames(activeQuadrant);

            setTimeout(function() {
                saveNameButton.classList.remove('saving');
                saveNameButton.classList.remove('button-ready');
                saveNameButton.disabled = false;
            }, 700);
        }
    });

    nameInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            saveNameButton.click();
        }
    });

    acceptDeleteButton.addEventListener('click', async function() {
        if (nameToDelete.quadrant !== null && nameToDelete.docId !== null) {
            try {
                await deleteName(nameToDelete.quadrant, nameToDelete.docId);
                
                showNameModalNotification("El nombre ha sido eliminado.");
                
                await getNamesForQuadrant(nameToDelete.quadrant);
                await displayNames(nameToDelete.quadrant);

                closeConfirmModal();
            } catch (error) {
                showNotification(deleteNotification, "Error al eliminar. Inténtalo de nuevo.", true);
                console.error("Error al eliminar el nombre:", error);
            }
        }
    });

    cancelDeleteButton.addEventListener('click', function() {
        closeConfirmModal();
    });
    
    async function saveName(quadrant, name) {
        try {
            var namesCollectionRef = window.collection(window.db, quadrant);
            await window.addDoc(namesCollectionRef, {
                nombre: name,
                timestamp: new Date()
            });
            console.log("Nombre guardado en Firestore!");
        } catch (e) {
            console.error("Error al guardar el nombre: ", e);
            throw e;
        }
    }

    async function displayNames(quadrant) {
        nameList.innerHTML = '';
        var namesInCache = quadrantData[quadrant];
        if (namesInCache) {
            namesInCache.forEach(function(data) {
                var li = document.createElement('li');
                li.textContent = data.nombre;
                var deleteButton = document.createElement('button');
                deleteButton.textContent = '×';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', function() {
                    nameToDelete.quadrant = quadrant;
                    nameToDelete.docId = data.id;
                    nameToDeleteSpan.textContent = data.nombre;
                    openModal(confirmModal);
                });
                li.appendChild(deleteButton);
                nameList.appendChild(li);
            });
        }
    }

    async function deleteName(quadrant, docId) {
        try {
            var nameDocRef = window.doc(window.db, quadrant, docId);
            await window.deleteDoc(nameDocRef);
            console.log("Nombre eliminado con éxito!");
        } catch (e) {
            console.error("Error al eliminar el nombre: ", e);
            throw e;
        }
    }

    async function captureAndDownloadNames(bgColor) {
        var topLeftNames = quadrantData['top-left'];
        var topRightNames = quadrantData['top-right'];
        var bottomLeftNames = quadrantData['bottom-left'];
        var bottomRightNames = quadrantData['bottom-right'];

        function createNameList(names, color) {
            return names.map(function(name) {
                return '<li style="font-size: 14px; line-height: 1.0; margin: 2px 0; font-weight: 300; color: ' + color + ';">' + name.nombre + '</li>';
            }).join('');
        };
        
        var tempCircleContainer = document.createElement('div');
        tempCircleContainer.style.width = 'min(100vw, 600px)';
        tempCircleContainer.style.height = 'min(100vw, 600px)';
        tempCircleContainer.style.borderRadius = '50%';
        tempCircleContainer.style.overflow = 'hidden';
        tempCircleContainer.style.position = 'fixed';
        tempCircleContainer.style.top = '-9999px';
        tempCircleContainer.style.backgroundColor = bgColor;
        tempCircleContainer.style.fontFamily = 'Poppins, sans-serif';

        var quadrantStyle = 'width: 50%; height: 50%; display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 10px; box-sizing: border-box; text-align: center;';

        var quadrantHTML = ' <div style="display: flex; flex-wrap: wrap; width: 100%; height: 100%;"> <div style="' + quadrantStyle + ' background-color: #5CA5BB;"> <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">' + createNameList(topLeftNames, '#FFFFFF') + '</ul> </div> <div style="' + quadrantStyle + ' background-color: #C94C69;"> <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">' + createNameList(topRightNames, '#FFFFFF') + '</ul> </div> <div style="' + quadrantStyle + ' background-color: #63C963;"> <ul style="list-style-type: none; padding: 0; margin: 0; color: ' + (bgColor === 'black' ? '#FFFFFF' : '#171717') + ';">' + createNameList(bottomLeftNames, bgColor === 'black' ? '#FFFFFF' : '#171717') + '</ul> </div> <div style="' + quadrantStyle + ' background-color: #D5D968;"> <ul style="list-style-type: none; padding: 0; margin: 0; color: #FFFFFF;">' + createNameList(bottomRightNames, '#FFFFFF') + '</ul> </div> </div> ';
        
        tempCircleContainer.innerHTML = quadrantHTML;
        document.body.appendChild(tempCircleContainer);

        return html2canvas(tempCircleContainer, {
            scale: 8,
            backgroundColor: bgColor 
        }).then(function(canvas) {
            var link = document.createElement('a');
            link.download = 'cuadrantes.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            tempCircleContainer.remove();
        });
    }

    var preloadData = async function() {
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
    startQuadrantAnimation(); 
});
