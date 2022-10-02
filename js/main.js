// @ts-check

import { wrapText, slugifyName, element, isValidFile } from "./utils.js";
import { useCanvas, useInput, useButton, useCanvasSide, setCanvasSide } from "./useElements.js";

// Global Variables //
/** URL de la imagen */
let imageURL = ""

/** Imagen cortada (en caso de que aun no se recorte nada, será null) */
let cuttedImage = null

/** Muestra si hay un cover mostrandose actualmente */
let showingCover = false

/** Flag que guarda si hay cambios sin guardar */
let changes = false

/** 
 * Cambia el titulo para mostrar (u ocultar) la leyenda de cambios sin guardar
 * Además cambia la flag
 * @param {boolean} newValue - Nuevo valor para la flag de values
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

/** 
 * Función para descargar la imagen 
 */
function downloadImg(){
    const txtName = useInput('#txtName')
    const [canvasResult] = useCanvas()

    const name = slugifyName(txtName.value)
    
    // Crear un elemento <a>
    let link = document.createElement('a');

    // El título
    link.download = `${name}.jpg`;

    // Convertir la imagen a Base64 y ponerlo en el enlace
    link.href = canvasResult.toDataURL("image/jpeg", 1);

    // Hacer click en él
    link.click();

    // Ya no hay cambios sin guardar
    setChanges(false)
}

/** 
 * Función que abre el editor con la imagen seleccionada 
 * @param {File} file - El archivo para editar y poner en el canvas
 */
function openCropEditor(file){
    if(!handleFileValidation(file)) return

    const divEditor = element('#divEditor')
    
    // Obtiene la imagen
    imageURL = URL.createObjectURL(file);

    // Se ha puesto la imagen, por lo tanto, ya hay una
    showingCover = true

    // Al cambiar de imagen, la imagen cortada desaparece, y se coloca el
    // cuadrado más facil de la nueva en el canvas
    cuttedImage = null
    drawImage()

    // Borra editor en caso que existiera una imagen previa
    divEditor.innerHTML = '';
    adjustEditor()

    const cropprImg = document.createElement('img');
    cropprImg.setAttribute('id', 'croppr');
    divEditor.appendChild(cropprImg);

    // Envia la imagen al editor para su recorte
    element('#croppr').setAttribute('src', imageURL);

    // Crea el editor
    // @ts-ignore - Croppr no existe en el global, pero si en un script antes
    new Croppr('#croppr', {
        aspectRatio: 1,
        startSize: [70, 70],
        onCropEnd: function(data){
            cuttedImage = data
            drawImage()
        }
    })
}

/**
 * Creates a new Image() with a src and a function to run when loaded
 * @param {string} src 
 * @param {(image:HTMLImageElement) => void} onLoad 
 */
function createImg(src, onLoad){
    const img = new Image()
    img.onload = () => onLoad(img)
    img.src = src
}

/** 
 * Función que activa el arbol de dibujo, dibujando primeramente la imagen y mandando a 
 * llamar a la función que dibuja las lineas
 */
function drawImage() {
    const [canvasResult, ctx] = useCanvas()
    const btnDownload = useButton('#btnDownload')
    
    // Ahora hay cambios sin guardar
    setChanges(true)

    // Limpia la previa en caso que existiera algún elemento previo
    ctx.clearRect(0, 0, canvasResult.width, canvasResult.height);

    // Si existe una imagen cortada, hace operaciones con ella
    if(cuttedImage){
        // Variables
        const sideLength = useCanvasSide()
        const {x, y, width, height} = cuttedImage
    
        // Adecuo el canvas
        canvasResult.width = sideLength;
        canvasResult.height = sideLength;

        // Creamos una nueva imagen que será la del canvas
        createImg(imageURL, image => {
            // Se pega en el canvas la imagen recortada y se dibujan las lineas
            ctx.drawImage(image, x, y, width, height, 0, 0, sideLength, sideLength);
            drawLines()
        })
    }
    // Si no, entonces las hace con el cuadrado más fácil
    else{
        createImg(imageURL, image => {
            const sideLength = useCanvasSide()
            const imageSide = Math.min(image.width, image.height)

            canvasResult.width = sideLength
            canvasResult.height = sideLength

            const sx = (image.width / 2) - (imageSide / 2)
            const sy = (image.height / 2) - (imageSide / 2)

            ctx.drawImage(image, sx, sy, imageSide, imageSide, 0, 0, sideLength, sideLength)
            drawLines()
        })
    }

    // Si hay cover ya muestralo, sino (por ejemplo, si solo se cambió el color desde un inicio)
    // entonces no
    if(showingCover){
        document.querySelectorAll('.temporalHidden').forEach(hiddenElement => 
            hiddenElement.classList.remove('temporalHidden')
        )
        btnDownload.disabled = false
    }
}

/** 
 * Funcion que dibuja las lineas en el canvas y llama a la función que dibuja el texto
 */
function drawLines(){
    const [canvasResult, ctx] = useCanvas()
    const dialogColor = useInput('#dialogColor')

    const BOTTOM_LINE_HEIGHT_PERCENTAGE = 5
    const SIDE_LINE_HEIGHT_PERCENTAGE = 15

    const REAL_BOTTOM_HEIGHT = (BOTTOM_LINE_HEIGHT_PERCENTAGE * canvasResult.height) / 100
    const REAL_SIDE_HEIGHT = (SIDE_LINE_HEIGHT_PERCENTAGE * canvasResult.height) / 100

    // El ancho de la tira del lado será igual que el alto de la de abajo
    const REAL_SIDE_WIDTH = REAL_BOTTOM_HEIGHT

    const BOTTOM_LINE_START = canvasResult.height - REAL_BOTTOM_HEIGHT
    const SIDE_LINE_START = canvasResult.height - 2.5*REAL_BOTTOM_HEIGHT - REAL_SIDE_HEIGHT

    ctx.fillStyle = dialogColor.value

    ctx.fillRect(0, BOTTOM_LINE_START, canvasResult.width, REAL_BOTTOM_HEIGHT)
    ctx.fillRect(0, SIDE_LINE_START, REAL_SIDE_WIDTH, REAL_SIDE_HEIGHT)

    // Inicia a la misma altura que la linea de al lado y al final de esta (más un margen de la misma anchura)
    writeText(2*REAL_SIDE_WIDTH, SIDE_LINE_START, REAL_SIDE_HEIGHT*0.60, REAL_SIDE_HEIGHT)
}

/** 
 * Función que dibuja el texto en el canvas y manda a llamar a la función para dibujar el logo
 * @param {number} startXPosition
 * @param {number} startYPosition
 * @param {number} textHeight
 * @param {number} sideHeight
*/
function writeText(startXPosition, startYPosition, textHeight, sideHeight){
    const [canvasResult, ctx] = useCanvas()
    const txtName = useInput('#txtName')
    const dialogText = useInput('#dialogText')
    
    const text = txtName.value.trim()

    ctx.fillStyle = dialogText.value
    ctx.font = `bold ${textHeight}px gotham`

    const wrappedText = wrapText(ctx, text, startXPosition, startYPosition + textHeight/2, canvasResult.width - startXPosition, textHeight)

    const TEXT_HEIGHT = wrappedText.length * textHeight

    wrappedText.forEach(line => {
        ctx.fillText(line[0], line[1], line[2] - TEXT_HEIGHT + sideHeight)
    })

    drawLogo()
}

/** 
 * Función que dibuja el logo en el canvas 
 */
function drawLogo(){
    const chkMostrarLogo = useInput('#chkMostrarLogo')
    const [canvasResult, ctx] = useCanvas()

    const shouldDraw = chkMostrarLogo.checked
    
    if(shouldDraw){
        // Se crea tambien la imagen que es del logo y se pone chiquita arriba
        createImg( './img/jebfire_mc.png', image => {
            const LOGO_PADDING_PERCENTAGE = 2.5
            const LOGO_SIZE_PERCENTAGE = 10

            const REAL_LOGO_PADDING = (LOGO_PADDING_PERCENTAGE * canvasResult.width) / 100
            const REAL_LOGO_SIZE = (LOGO_SIZE_PERCENTAGE * canvasResult.width) / 100

            ctx.drawImage(image, REAL_LOGO_PADDING, REAL_LOGO_PADDING, REAL_LOGO_SIZE, REAL_LOGO_SIZE)
        })
    }
}

/**
 * Verifica si el archivo es valido, si lo es, retorna true y elimina las clases
 * de invalidez en la dropzone; si es inválido, regresa false, pone clases de
 * inválidez y escribe la retroalimentación el el errorTooltip
 * @param {File} file 
 * @return {boolean}
 */
function handleFileValidation(file){
    const [isValid, retro] = isValidFile(file)

    const dropzone = element('#dropzone')
    const errorTooltip = element('#errorTooltip')

    dropzone.setAttribute('aria-invalid', String(!isValid))
    errorTooltip.setAttribute('aria-invalid', String(!isValid))
    errorTooltip.textContent = retro

    return isValid
}

/** 
 * Funcion para copiar el color de uno de los inputs al otro
 * @param {string} from - Selector tipo CSS del input de origen
 * @param {string} to - Selector tipo CSS del input de destino
 */
function copyColor(from, to){
    useInput(to).value = useButton(from).value
}

/**
 * Ajusta el editor a la anchura adecuada
 */
function adjustEditor(){
    element('#divEditor').style.width = `${useCanvasSide()}px`
}

/**
 * Ajusta si el consejo de que la imagen se puede ver diferente se muestra o no,'
 * dependiendo del tamaño del canvas
 */
function adjustPreviewTooltip(){
    if(useCanvasSide() <= 300){
        element('.only-small').setAttribute('data-visible', "true")
    }
    else{
        element('.only-small').setAttribute('data-visible', "false")
    }
}

/**
 * Ajusta los elementos estaticos que necesitan cambiar manualmente su
 * anchura con un calculo de JS (canvas y divEditor)
 */
function updateStatics(){
    setCanvasSide()
    adjustEditor()
    adjustPreviewTooltip()
    drawImage()
}

/**
 * Función para agregar los eventos a los elementos
 */
function addEvents(){
    // Añade eventos a la dropzone para depositar el archivo //
    /** @type {HTMLDivElement} */
    const dropzone = element('#dropzone')
    dropzone.addEventListener('dragover', e => {
        e.preventDefault()
        dropzone.classList.add('active')
        element('#lblDrop').textContent = "Suelta para subir los archivos"
    })
    dropzone.addEventListener('dragleave', e => {
        e.preventDefault()
        dropzone.classList.remove('active')
        element('#lblDrop').textContent = "Arrastra y suelta imágenes"
    })
    dropzone.addEventListener('drop', e => {
        e.preventDefault()
        dropzone.classList.remove('active')
        
        if(e.dataTransfer){
            openCropEditor(e.dataTransfer.files[0])  
        }
    })

    // Añade eventos para que al cambiar la foto, cambie //
    useButton('#btnSelectPhoto').addEventListener('click', () => {
        useInput('#fileDialog').click()
    })
    useInput('#fileDialog').addEventListener('change', e => {
       // @ts-ignore - Parece ser una feature de TS que solo se arregla con un "as"
        openCropEditor(e.target.files[0])            
    })

    // Eventos para los botones para copiar color //
    useButton('#sameAsText').addEventListener('click', () => {
        copyColor('#dialogText', '#dialogColor')
        drawImage()
    })
    useButton('#sameAsColor').addEventListener('click', () => {
        copyColor('#dialogColor', '#dialogText')
        drawImage()
    })

    // Eventos para que se dibuje la imagen en cada cambio
    useInput('#txtName').addEventListener('input', drawImage)
    useInput('#dialogColor').addEventListener('change', drawImage)
    useInput('#dialogText').addEventListener('change', drawImage)
    useInput('#chkMostrarLogo').addEventListener('change', drawImage)
    useButton('#btnDownload').addEventListener('click', downloadImg)
    useButton('#btnCloseModal').addEventListener('click', element('#modal').close)

    
    // Evitar salir sin que pierdas los cambios //
    window.addEventListener('beforeunload', e => {
        if (changes) {
            e.preventDefault();
            e.returnValue = '';
            return;
        }
    
        delete e['returnValue'];
    }) 

    // Al inicio y al actualizar ancho, que se actualice el ancho maximo
    updateStatics()
    window.addEventListener('resize', updateStatics)
}

document.addEventListener('DOMContentLoaded', addEvents)