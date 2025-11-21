const terminal = document.getElementById("terminal")
const output = document.getElementById("output")
const input = document.getElementById("input")

let authToken = null
const API_URL = "http://localhost:3000/api"
let lastListedProducts = []

function printHeader() {
    output.innerHTML = ""

    printToTerminal("Bunker Inventory System v1.0 :: Status | Conectado a la red")
    printToTerminal("Escribí 'ayuda' para ver los comandos disponibles.")
}

function printToTerminal(text) {
    output.innerHTML += `<div>${text}</div>`
    terminal.scrollTop = terminal.scrollHeight
}

function formatHelpLine(command, description) {
    const commandColor = "#66ff66"
    const fixedWidth = 30 // Aumentamos el ancho para que entren los comandos más largos
    const coloredCommand = `<span style='color: ${commandColor};'>  ${command}</span>`
    let padding = ""
    if (fixedWidth > command.length) {
        padding = "&nbsp;".repeat(fixedWidth - command.length)
    }
    return `${coloredCommand}${padding}- ${description}`
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
            if (commandParts[1] === "crear") {
                printToTerminal("Uso del comando 'crear':")
                printToTerminal('  crear "Nombre" "Descripción" <precio> <stock> <url_imagen>')
                printToTerminal(
                    '  Ej: crear "Gafas de Visión Nocturna" "Para ver en la oscuridad total" 250 5 "url.com/img.png"',
                )
            } else if (commandParts[1] === "actualizar") {
                printToTerminal("Uso del comando 'actualizar':")
                printToTerminal("  actualizar <#> <campo> <nuevo_valor>")
                printToTerminal("  Campos válidos: name, description, price, stock, imageUrl.")
                printToTerminal("  Ej: actualizar 2 stock 45")
            } else {
                printToTerminal("Comandos disponibles:")
                printToTerminal(formatHelpLine("login <email> <pass>", "Inicia sesión en el sistema.")) // Longitud: 22
                printToTerminal(formatHelpLine("listar", "Muestra el inventario.")) // Longitud: 6
                printToTerminal(formatHelpLine("inspeccionar <#>", "Muestra detalles de un item.")) // Longitud: 18
                printToTerminal(formatHelpLine('crear "<nombre>" ...', "Crea un nuevo item.")) // Longitud: 21
                printToTerminal(formatHelpLine("actualizar <#> ...", "Actualiza un item.")) // Longitud: 19
                printToTerminal(formatHelpLine("eliminar <#>", "Elimina un item del inventario.")) // Longitud: 14
                printToTerminal(formatHelpLine("limpiar", "Limpia la pantalla de la terminal.")) // Longitud: 7
                printToTerminal(formatHelpLine("ayuda", "Muestra esta lista de comandos.")) // Longitud: 5
                printToTerminal(formatHelpLine("ayuda <comando>", "Muestra ayuda específica para un comando.")) // Longitud: 15
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

printHeader()
