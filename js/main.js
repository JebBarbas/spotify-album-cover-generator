/** @description: wrapText wraps HTML canvas text onto a canvas of fixed width
 * @param {CanvasRenderingContext2D} ctx - the context for the canvas we want to wrap text on
 * @param {string} text - the text we want to wrap.
 * @param {number} x - the X starting point of the text on the canvas.
 * @param {number} y - the Y starting point of the text on the canvas.
 * @param {number} maxWidth - the width at which we want line breaks to begin - i.e. the maximum width of the canvas.
 * @param {number} lineHeight - the height of each line, so we can space them below each other.
 * @returns an array of [ lineText, x, y ] for all lines
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    // First, start by splitting all of our text into words, but splitting it into an array split by spaces
    let words = text.split(' ');
    let line = ''; // This will store the text of the current line
    let testLine = ''; // This will store the text when we add a word, to test if it's too long
    let lineArray = []; // This is an array of lines, which the function will return

    // Lets iterate over each word
    for(let n = 0; n < words.length; n++) {
        // Create a test line, and measure it..
        testLine += `${words[n]} `;
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        // If the width of this test line is more than the max width
        if (testWidth > maxWidth && n > 0) {
            // Then the line is finished, push the current line into "lineArray"
            lineArray.push([line, x, y]);
            // Increase the line height, so a new line is started
            y += lineHeight;
            // Update line and test line to use this word as the first word on the next line
            line = `${words[n]} `;
            testLine = `${words[n]} `;
        }
        else {
            // If the test line is still less than the max width, then add the word to the current line
            line += `${words[n]} `;
        }
        // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
        if(n === words.length - 1) {
            lineArray.push([line, x, y]);
        }
    }
    // Return the line array
    return lineArray;
}

/** Slugifies a name to a safer download 
 * @param {string} name
*/
function slugifyName(name){
    return name.toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
}

/**
 * Función principal donde se crean las variables y eventos
 */
function main(){
    /** Botón para seleccionar la foto del albúm 
     * @type { HTMLInputElement }
    */
    const btnSelectPhoto = document.getElementById('btnSelectPhoto')

    /** Input donde se escribirá el nombre y el texto de la foto 
     * @type { HTMLInputElement }
    */
    const txtName = document.getElementById('txtName')

    /** Dialogo donde se seleccionó el color de las lineas
     * @type { HTMLInputElement }
    */
     const dialogColor = document.getElementById('dialogColor')

    /** Dialogo donde se seleccionó el color del texto
     * @type { HTMLInputElement }
    */
    const dialogText = document.getElementById('dialogText')

    /** Canvas donde se previsualizará la foto para recortarla 
     * @type { HTMLDivElement }
    */ 
    const divEditor = document.getElementById('divEditor')

    /** Canvas donde se verá el resultado final 
     *  @type { HTMLCanvasElement } 
    */
    const canvasPreview = document.getElementById('canvasPreview')

    /** Area de dibujo del canvas del resultado final 
     * @type { CanvasRenderingContext2D }
    */
    const ctx = canvasPreview.getContext('2d')

    /** Switch que da la opción de mostrar el logo del desarrollador
     * @type { HTMLInputElement }
    */
     const chkMostrarLogo = document.getElementById('chkMostrarLogo')

    /** Botón de descarga de la imagen final 
     * @type { HTMLButtonElement }
    */
    const btnDownload = document.getElementById('btnDownload')

    /** Dialogo para mostrar mensajes
     * @type { HTMLDialogElement }
    */
    const modal = document.getElementById('modal')

    /** Botón para cerrar el modal 
     * @type { HTMLButtonElement }
    */
    const btnCloseModal = document.getElementById('btnCloseModal')

    /** URL de la imagen */
    let imageURL = ""

    /** Imagen cortada (en caso de que aun no se recorte nada, será null) */
    let cuttedImage = null

    /** Muestra si hay un cover mostrandose actualmente */
    let showingCover = false

    /** Flag que guarda si hay cambios sin guardar */
    let changes = false

    // Eventos para que se dibuje la imagen en cada cambio
    btnSelectPhoto.addEventListener('change', openCropEditor)
    txtName.addEventListener('input', drawImage)
    dialogColor.addEventListener('change', drawImage)
    dialogText.addEventListener('change', drawImage)
    chkMostrarLogo.addEventListener('change', drawImage)
    btnDownload.addEventListener('click', downloadImg)
    btnCloseModal.addEventListener('click', () => modal.close())

    /** Evitar salir sin que pierdas los cambios */
    window.addEventListener('beforeunload', e => {
        if (changes) {
            e.preventDefault();
            e.returnValue = '';
            return;
        }
    
        delete e['returnValue'];
    })

    /** Cambia el titulo para mostrar (u ocultar) la leyenda de cambios sin guardar
     * Además cambia la flag
     */
    function setChanges(newValue){
        if(newValue !== changes){
            const title = 'Generador de Covers para Álbumes'
            
            if(newValue){
                document.title = `✏ ${title} (cambios sin guardar)`
                changes = true
            }
            else{
                document.title = title
                changes = false
            }
        }
    }

    /** Metodo para descargar la imagen */
    function downloadImg(){
        const name = slugifyName(txtName.value)
        
        // Crear un elemento <a>
        let enlace = document.createElement('a');
        // El título
        enlace.download = `${name}.jpg`;
        // Convertir la imagen a Base64 y ponerlo en el enlace
        enlace.href = canvasPreview.toDataURL("image/jpeg", 1);
        // Hacer click en él
        enlace.click();

        // Ya no hay cambios sin guardar
        setChanges(false)
    }

    /** Método que abre el editor con la imagen seleccionada */
    function openCropEditor(e){
        // Obtiene la imagen
        imageURL = URL.createObjectURL(e.target.files[0]);

        // Se ha puesto la imagen, por lo tanto, ya hay una
        showingCover = true

        // Al cambiar de imagen, la imagen cortada desaparece, y se coloca el
        // cuadrado más facil de la nueva en el canvas
        cuttedImage = null
        drawImage()

        // Borra editor en caso que existiera una imagen previa
        divEditor.innerHTML = '';

        const cropprImg = document.createElement('img');
        cropprImg.setAttribute('id', 'croppr');
        divEditor.appendChild(cropprImg);
    
        // Envia la imagen al editor para su recorte
        document.querySelector('#croppr').setAttribute('src', imageURL);
    
        // Crea el editor
        new Croppr('#croppr', {
            aspectRatio: 1,
            startSize: [70, 70],
            onCropEnd: function(data){
                cuttedImage = data
                drawImage()
            }
        })
    }

    /** Método que dibuja la imagen, ya sea */
    function drawImage() {
        // Ahora hay cambios sin guardar
        setChanges(true)

        // Limpia la previa en caso que existiera algún elemento previo
        ctx.clearRect(0, 0, canvasPreview.width, canvasPreview.height);

        // Si existe una imagen cortada, hace operaciones con ella
        if(cuttedImage){
            // Variables
            const initialX = cuttedImage.x;
            const initialY = cuttedImage.y;
            const newWidth = cuttedImage.width;
            const newHeight = cuttedImage.height;

            // Adecuo el canvas
            canvasPreview.width = newWidth;
            canvasPreview.height = newHeight;

            // Creamos una nueva imagen que será la del canvas
            let tempImg = new Image();

            // Cuando la imagen se carge se procederá al recorte
            tempImg.onload = function() {
                // Se pega en el canvas la imagen recortada y se dibujan las lineas
                ctx.drawImage(tempImg, initialX, initialY, newWidth, newHeight, 0, 0, newWidth, newHeight);
                drawLines()
            }

            // Proporciona la imagen cruda, sin editarla por ahora
            tempImg.src = imageURL;
        }
        // Si no, entonces las hace con el cuadrado más fácil
        else{
            const newImage = new Image()

            newImage.onload = function(){
                const sideLength = Math.min(newImage.width, newImage.height)

                const sx = (newImage.width / 2) - (sideLength / 2)
                const sy = (newImage.height / 2) - (sideLength / 2)

                canvasPreview.width = sideLength
                canvasPreview.height = sideLength

                ctx.drawImage(newImage, sx, sy, sideLength, sideLength, 0, 0, sideLength, sideLength)
                drawLines()
            }

            newImage.src = imageURL
        }

        // Si hay cover ya muestralo, sino (por ejemplo, si solo se cambió el color desde un inicio)
        // entonces no
        if(showingCover){
            document.querySelectorAll('.temporalHidden').forEach(element => 
                element.classList.remove('temporalHidden')
            )
            btnDownload.disabled = false
        }
    }

    /** Funcion que dibuja las lineas y el texto en el canvas */
    function drawLines(){
        const BOTTOM_LINE_HEIGHT_PERCENTAGE = 5
        const SIDE_LINE_HEIGHT_PERCENTAGE = 15

        const REAL_BOTTOM_HEIGHT = (BOTTOM_LINE_HEIGHT_PERCENTAGE * canvasPreview.height) / 100
        const REAL_SIDE_HEIGHT = (SIDE_LINE_HEIGHT_PERCENTAGE * canvasPreview.height) / 100

        // El ancho de la tira del lado será igual que el alto de la de abajo
        const REAL_SIDE_WIDTH = REAL_BOTTOM_HEIGHT

        const BOTTOM_LINE_START = canvasPreview.height - REAL_BOTTOM_HEIGHT
        const SIDE_LINE_START = canvasPreview.height - 2.5*REAL_BOTTOM_HEIGHT - REAL_SIDE_HEIGHT

        ctx.fillStyle = dialogColor.value

        ctx.fillRect(0, BOTTOM_LINE_START, canvasPreview.width, REAL_BOTTOM_HEIGHT)
        ctx.fillRect(0, SIDE_LINE_START, REAL_SIDE_WIDTH, REAL_SIDE_HEIGHT)

        // Inicia a la misma altura que la linea de al lado y al final de esta (más un margen de la misma anchura)
        writeText(2*REAL_SIDE_WIDTH, SIDE_LINE_START, REAL_SIDE_HEIGHT*0.60, REAL_SIDE_HEIGHT)
    }

    /** Funcion que dibuja el texto de la imagen */
    function writeText(startXPosition, startYPosition, textHeight, sideHeight){
        const text = txtName.value.trim()

        ctx.fillStyle = dialogText.value
        ctx.font = `bold ${textHeight}px gotham`

        const wrappedText = wrapText(ctx, text, startXPosition, startYPosition + textHeight/2, canvasPreview.width - startXPosition, textHeight)

        const TEXT_HEIGHT = wrappedText.length * textHeight

        wrappedText.forEach(line => {
            ctx.fillText(line[0], line[1], line[2] - TEXT_HEIGHT + sideHeight)
        })

        drawLogo()
    }
    
    /** Funcion que dibuja mi logo en el canvas */
    function drawLogo(){
        const shouldDraw = chkMostrarLogo.checked
        
        if(shouldDraw){
            // Se crea tambien la imagen que es del logo y se pone chiquita arriba
            const miniLogo = new Image()
            miniLogo.onload = function(){
                const LOGO_PADDING_PERCENTAGE = 2.5
                const LOGO_SIZE_PERCENTAGE = 10

                const REAL_LOGO_PADDING = (LOGO_PADDING_PERCENTAGE * canvasPreview.width) / 100
                const REAL_LOGO_SIZE = (LOGO_SIZE_PERCENTAGE * canvasPreview.width) / 100

                ctx.drawImage(miniLogo, REAL_LOGO_PADDING, REAL_LOGO_PADDING, REAL_LOGO_SIZE, REAL_LOGO_SIZE)
                //, 0, 0, REAL_LOGO_SIZE, REAL_LOGO_SIZE)
            }
            miniLogo.src = './img/jebfire_mc.png'
        }
    }
}

document.addEventListener('DOMContentLoaded', main)