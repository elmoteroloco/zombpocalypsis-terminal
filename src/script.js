const terminal = document.getElementById("terminal")
const output = document.getElementById("output")
const input = document.getElementById("input")
const inputMirror = document.getElementById("input-mirror")
const cursor = document.getElementById("cursor")

let authToken = null
const API_URL = "http://localhost:3000/api"
let lastListedProducts = []

async function printHeader() {
    output.innerHTML = ""

    try {
        const response = await fetch("/public/ascii/logo.txt")
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const logoText = await response.text()
        logoText.split("\n").forEach((line) => printToTerminal(line))
    } catch (error) {
        console.error("No se pudo cargar el logo:", error)
        printToTerminal("Error al cargar el logo. Iniciando sistema...")
    } finally {
        printToTerminal("Bunker Inventory System v1.0 :: Status | Conectado a la red")
        printToTerminal("Escribí 'ayuda' para ver los comandos disponibles.")
    }
}

function printToTerminal(text) {
    output.innerHTML += `<div>${text}</div>`
    terminal.scrollTop = terminal.scrollHeight
}

function formatHelpLine(command, description) {
    const commandColor = "#66ff66"
    const fixedWidth = 30
    const commandWithoutEntities = command.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    const coloredCommand = `<span style="color: ${commandColor};">  ${command}</span>`
    let padding = " "

    if (fixedWidth > commandWithoutEntities.length) {
        padding = ".".repeat(fixedWidth - commandWithoutEntities.length)
    }
    return `${coloredCommand} ${padding} ${description}`
}

function parseCommand(command) {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g
    const parts = []
    let match
    while ((match = regex.exec(command))) {
        parts.push(match[1] || match[2] || match[0])
    }
    return parts
}

function printProductDetails(product) {
    printToTerminal(`--- Ficha de Item: ${product.name} ---`)
    printToTerminal(`  ID: ${product.id}`)
    printToTerminal(`  Descripción: ${product.description}`)
    printToTerminal(`  Precio: ${product.price} créditos`)
    printToTerminal(`  Stock: ${product.stock} unidades`)
    printToTerminal(`  Imagen: ${product.imageUrl}`)
}

async function handleCommand(command) {
    if (command.trim() === "") {
        return
    }
    const commandParts = parseCommand(command)
    const mainCommand = commandParts[0]

    printToTerminal(`> ${command}`)

    switch (mainCommand) {
        case "ayuda":
            const subCommand = commandParts[1]
            if (subCommand) {
                switch (subCommand) {
                    case "login":
                        printToTerminal("Uso del comando 'login':")
                        printToTerminal("  login <email> <contraseña>")
                        printToTerminal("  Ej: login admin@bunker.com 123456")
                        break
                    case "listar":
                        printToTerminal("Uso del comando 'listar':")
                        printToTerminal("  Muestra todos los productos del inventario.")
                        printToTerminal("  Requiere haber iniciado sesión.")
                        break
                    case "inspeccionar":
                        printToTerminal("Uso del comando 'inspeccionar':")
                        printToTerminal("  inspeccionar <#>")
                        printToTerminal(
                            "  Muestra los detalles de un item usando su número de la lista (obtenido con 'listar').",
                        )
                        printToTerminal("  Ej: inspeccionar 1")
                        break
                    case "crear":
                        printToTerminal("Uso del comando 'crear':")
                        printToTerminal('  crear "Nombre" "Descripción" <precio> <stock> <url_imagen>')
                        printToTerminal(
                            '  Ej: crear "Gafas de Visión Nocturna" "Para ver en la oscuridad total" 250 5 "url.com/img.png"',
                        )
                        break
                    case "actualizar":
                        printToTerminal("Uso del comando 'actualizar':")
                        printToTerminal("  actualizar <#> <campo> <nuevo_valor>")
                        printToTerminal("  Campos válidos: name, description, price, stock, imageUrl.")
                        printToTerminal("  Ej: actualizar 2 stock 45")
                        break
                    case "eliminar":
                        printToTerminal("Uso del comando 'eliminar':")
                        printToTerminal("  eliminar <#>")
                        printToTerminal("  Elimina un item del inventario usando su número de la lista.")
                        printToTerminal("  Ej: eliminar 3")
                        break
                    default:
                        printToTerminal(`Comando 'ayuda ${subCommand}' no reconocido.`)
                        break
                }
            } else {
                printToTerminal("Comandos disponibles:")
                printToTerminal(formatHelpLine("login &lt;email&gt; &lt;pass&gt;", "Inicia sesión en el sistema."))
                printToTerminal(formatHelpLine("listar", "Muestra el inventario.")) // l: 6
                printToTerminal(formatHelpLine("inspeccionar &lt;#&gt;", "Muestra detalles de un item."))
                printToTerminal(formatHelpLine('crear "&lt;nombre&gt;" ...', "Crea un nuevo item."))
                printToTerminal(formatHelpLine("actualizar &lt;#&gt; ...", "Actualiza un item."))
                printToTerminal(formatHelpLine("eliminar &lt;#&gt;", "Elimina un item del inventario."))
                printToTerminal(formatHelpLine("ayuda", "Muestra esta lista de comandos.")) // l: 5
                printToTerminal(formatHelpLine("ayuda &lt;comando&gt;", "Muestra ayuda para un comando específico."))
                printToTerminal(formatHelpLine("limpiar", "Limpia la pantalla de la terminal.")) // l: 7
            }
            break

        case "login":
            const email = commandParts[1].toLowerCase()
            const password = commandParts[2]
            if (!email || !password) {
                printToTerminal("Error: Se requiere email y contraseña. Uso: login <email> <password>")
                break
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                })
                const data = await response.json()
                if (response.ok) {
                    authToken = data.token
                    printToTerminal("Login exitoso. Token de acceso almacenado.")
                } else {
                    printToTerminal(`Error de autenticación: ${data.message}`)
                }
            } catch (error) {
                printToTerminal("Error de conexión con el servidor.")
            }
            break

        case "listar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.")
                break
            }

            try {
                const response = await fetch(`${API_URL}/products`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                })
                const products = await response.json()
                lastListedProducts = products

                printToTerminal("Inventario del Búnker:")
                products.forEach((p, i) => printToTerminal(`  <${i + 1}> [${p.id}] - ${p.name} (Stock: ${p.stock})`))
            } catch (error) {
                printToTerminal("Error al obtener el inventario.")
            }
            break

        case "inspeccionar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.")
                break
            }
            const itemIndex = parseInt(commandParts[1], 10) - 1
            if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= lastListedProducts.length) {
                printToTerminal("Error: Número de item inválido. Usá 'listar' para ver el inventario.")
                break
            }
            const productId = lastListedProducts[itemIndex].id
            try {
                const response = await fetch(`${API_URL}/products/${productId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                })
                const product = await response.json()
                printProductDetails(product)
            } catch (error) {
                printToTerminal("Error al obtener los detalles del item.")
            }
            break

        case "crear":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.")
                break
            }
            const newProductData = {
                name: commandParts[1],
                description: commandParts[2],
                price: parseInt(commandParts[3], 10),
                stock: parseInt(commandParts[4], 10),
                imageUrl: commandParts[5],
            }
            try {
                const response = await fetch(`${API_URL}/products/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify(newProductData),
                })
                const createdProduct = await response.json()
                printToTerminal("Nuevo item agregado al inventario:")
                printProductDetails(createdProduct)
            } catch (error) {
                printToTerminal("Error al crear el item.")
            }
            break

        case "actualizar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.")
                break
            }
            const updateIndex = parseInt(commandParts[1], 10) - 1
            const updateField = commandParts[2]
            let updateValue = commandParts[3]
            if (updateField === "price" || updateField === "stock") {
                updateValue = parseInt(updateValue, 10)
            }
            try {
                const updateProductId = lastListedProducts[updateIndex].id
                const response = await fetch(`${API_URL}/products/${updateProductId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ [updateField]: updateValue }),
                })
                const updatedProduct = await response.json()
                printToTerminal("Item actualizado:")
                printProductDetails(updatedProduct)
            } catch (error) {
                printToTerminal("Error al actualizar el item.")
            }
            break

        case "eliminar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.")
                break
            }
            const deleteIndex = parseInt(commandParts[1], 10) - 1
            try {
                const deleteProductId = lastListedProducts[deleteIndex].id
                const response = await fetch(`${API_URL}/products/${deleteProductId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${authToken}` },
                })
                const result = await response.json()
                printToTerminal(result.message)
            } catch (error) {
                printToTerminal("Error al eliminar el item.")
            }
            break

        case "limpiar":
            printHeader()
            break

        default:
            printToTerminal(`Comando '${command}' no reconocido. Escribí 'ayuda' para ver la lista de comandos.`)
            break
    }
}

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const command = input.value
        input.value = ""
        handleCommand(command)
    }
})

// --- Lógica para el cursor y el input espejado ---

// Función para actualizar la posición del cursor
function updateCursor() {
    // Sincroniza el texto visible con el del input invisible
    inputMirror.textContent = input.value

    // Mide el texto hasta la posición del cursor para saber dónde ubicar el cursor de bloque
    const textBeforeCursor = input.value.substring(0, input.selectionStart)
    const mirror = document.createElement("span")
    mirror.textContent = textBeforeCursor
    document.body.appendChild(mirror) // Lo agrega temporalmente para medirlo
    const textWidth = mirror.offsetWidth
    document.body.removeChild(mirror)

    // Mueve el cursor a la posición correcta
    cursor.style.left = `${inputMirror.offsetLeft + textWidth}px`
}

// Actualiza el cursor en cada cambio o movimiento
input.addEventListener("input", updateCursor)
input.addEventListener("keydown", () => setTimeout(updateCursor, 0)) // setTimeout para keydown
input.addEventListener("click", updateCursor)

input.focus()
printHeader()
updateCursor() // Posición inicial del cursor
