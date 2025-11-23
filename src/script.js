const terminal = document.getElementById("terminal")
const output = document.getElementById("output")
const input = document.getElementById("input")
const promptElement = document.getElementById("prompt")
const connectionStatus = document.getElementById("connection-status")
const logo = document.getElementById("logo")

let authToken = null
let userRole = "guest"
const API_URL = "http://localhost:3000/api"
let lastListedProducts = []
let commandHistory = []
let historyIndex = -1
let isFirstCommand = true
let pendingAction = null

function clearTerminal() {
    output.innerHTML = ""
}

function printToTerminal(text, className = "") {
    const newDiv = document.createElement("div")
    if (className) {
        newDiv.className = className
    }
    newDiv.innerHTML = text
    output.appendChild(newDiv)
    terminal.scrollTop = terminal.scrollHeight
    return newDiv
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
    const detailsHtml = `
<div class="product-details-container">
    <div class="product-text-details">--- Ficha de Item: ${product.name} ---
  ID:          ${product.id}
  Categoría:   ${product.category}
  Descripción: ${product.description}
  Precio:      ${product.price} créditos
  Stock:       ${product.stock} unidades
    </div>
    <img src="${product.imageUrl}" alt="Imagen de ${product.name}" class="product-image" onerror="this.style.display='none'">
</div>`
    printToTerminal(detailsHtml, "info")
}

function updateUserStatus() {
    if (authToken) {
        const payload = JSON.parse(atob(authToken.split(".")[1]))
        userRole = payload.role
        connectionStatus.innerHTML = `Status | <span class="success">Conectado</span> :: User: ${payload.email} (<span class="info">${userRole}</span>)`
        if (userRole === "admin") {
            promptElement.textContent = "#"
            promptElement.classList.add("prompt-admin")
        } else {
            promptElement.textContent = ">"
            promptElement.classList.remove("prompt-admin")
        }
    } else {
        userRole = "guest"
        connectionStatus.innerHTML = `Status | <span class="error">Desconectado</span>`
        promptElement.textContent = ">"
        promptElement.classList.remove("prompt-admin")
    }
}

async function showLoadingMessage(message) {
    return printToTerminal(message, "loading")
}

function showGeneralHelp() {
    printToTerminal("Comandos disponibles:", "info")
    printToTerminal(formatHelpLine("login &lt;email&gt; &lt;pass&gt;", "Inicia sesión en el sistema."))
    printToTerminal(formatHelpLine("listar", "Muestra el inventario."))
    printToTerminal(formatHelpLine("inspeccionar &lt;#&gt;", "Muestra detalles de un item."))
    printToTerminal(formatHelpLine("crear [parámetros...]", "Crea un nuevo item (Admin)."))
    printToTerminal(formatHelpLine("actualizar &lt;#&gt; [campos...]", "Actualiza un item (Admin)."))
    printToTerminal(formatHelpLine("eliminar &lt;#&gt;", "Elimina un item (Admin)."))
    printToTerminal(formatHelpLine("ayuda", "Muestra esta lista de comandos."))
    printToTerminal(formatHelpLine("ayuda &lt;comando&gt;", "Muestra ayuda para un comando específico."))
    printToTerminal(formatHelpLine("limpiar", "Limpia la pantalla de la terminal."))
    printToTerminal(formatHelpLine("logout", "Cierra la sesión actual."))
}

function showCommandHelp(subCommand) {
    printToTerminal(`Uso del comando '${subCommand}':`, "info")
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
            printToTerminal("  Muestra los detalles de un item usando su número de la lista (obtenido con 'listar').")
            printToTerminal("  Ej: inspeccionar 1")
            break
        case "crear":
            printToTerminal('  crear "Nombre" "Categoría" "Descripción" <precio> <stock> "url_imagen"')
            printToTerminal("  Parámetros:")
            printToTerminal('    "Nombre"      (texto entre comillas)')
            printToTerminal('    "Categoría"   (texto entre comillas)')
            printToTerminal('    "Descripción" (texto entre comillas)')
            printToTerminal("    <precio>      (número entero)")
            printToTerminal("    <stock>       (número entero)")
            printToTerminal('    "url_imagen"  (texto entre comillas)')
            printToTerminal(
                '  Ej: crear "Ración de Combate" "Comida" "Nutritiva y de larga duración" 15 50 "imgs/racion.png"',
            )
            printToTerminal("  Requiere permisos de Administrador.")
            break
        case "actualizar":
            printToTerminal("  actualizar <#> <campo> <nuevo_valor> [...más campos]")
            printToTerminal("  Actualiza uno o más campos de un item. Requiere al menos un campo a modificar.")
            printToTerminal("  Campos válidos: name, category, description, price, stock, imageUrl.")
            printToTerminal('  Ej: actualizar 2 stock 45 price 150 description "Nueva descripción"')
            printToTerminal("  Requiere permisos de Administrador.")
            break
        case "eliminar":
            printToTerminal("Uso del comando 'eliminar':")
            printToTerminal("  eliminar <#>")
            printToTerminal("  Elimina un item del inventario usando su número de la lista.")
            printToTerminal("  Ej: eliminar 3")
            printToTerminal("  Requiere permisos de Administrador.")
            break
        case "ayuda":
            printToTerminal("Uso del comando 'ayuda':")
            printToTerminal("  ayuda [comando]")
            printToTerminal("  Muestra la lista general de comandos o la ayuda para un comando específico.")
            printToTerminal("  Ej: ayuda listar")
            break
        case "limpiar":
            printToTerminal("Uso del comando 'limpiar':")
            printToTerminal("  Limpia toda la información de la pantalla de la terminal.")
            break
        case "logout":
            printToTerminal("  Cierra la sesión actual y elimina el token de autenticación.")
            break
        default:
            printToTerminal(
                `Comando '${subCommand}' no reconocido. Escribí 'ayuda' para ver la lista completa.`,
                "error",
            )
            break
    }
}

async function handleCommand(command) {
    if (command.trim() === "") {
        return
    }

    if (command.trim() !== "") {
        commandHistory.unshift(command)
    }
    historyIndex = -1

    printToTerminal(`${promptElement.textContent} ${command}`)

    if (pendingAction) {
        const confirmation = command.toLowerCase()
        if (confirmation === "s") {
            const { action, productId, args } = pendingAction
            pendingAction = null
            await executePendingAction(action, productId, args)
        } else {
            printToTerminal("Operación cancelada.", "info")
            pendingAction = null
        }
        return
    }

    const commandParts = parseCommand(command)
    const mainCommand = commandParts[0].toLowerCase()
    let loadingMessageElement = null

    try {
        switch (mainCommand) {
            case "ayuda":
                const subCommand = commandParts[1]
                if (subCommand) {
                    showCommandHelp(subCommand)
                } else {
                    showGeneralHelp()
                }
                break

            case "limpiar":
                clearTerminal()
                break

            case "login":
                if (!commandParts[1] || !commandParts[2]) {
                    printToTerminal("Error: Se requiere email y contraseña. Uso: login <email> <password>", "error")
                    break
                }
                const email = commandParts[1].toLowerCase()
                const password = commandParts[2]

                loadingMessageElement = await showLoadingMessage("Autenticando en la red del búnker...")
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                })
                const data = await response.json()
                loadingMessageElement.remove()
                if (response.ok) {
                    authToken = data.token
                    printToTerminal("Login exitoso. Token de acceso almacenado.", "success")
                    updateUserStatus()
                } else {
                    printToTerminal(`Error de autenticación: ${data.message}`, "error")
                }
                break

            case "logout":
                authToken = null
                lastListedProducts = []
                updateUserStatus()
                printToTerminal("Sesión cerrada.", "info")
                break

            case "listar":
                if (!authToken) {
                    printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.", "error")
                    break
                }
                loadingMessageElement = await showLoadingMessage("Accediendo al inventario...")
                const listResponse = await fetch(`${API_URL}/products`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                })
                loadingMessageElement.remove()
                const products = await listResponse.json()
                lastListedProducts = products

                printToTerminal("Inventario:", "info")
                if (products.length === 0) {
                    printToTerminal("  El inventario está vacío.")
                } else {
                    products.forEach((p, i) =>
                        printToTerminal(`  <${i + 1}> [${p.id}] - ${p.name} (Stock: ${p.stock})`),
                    )
                }
                break

            case "inspeccionar":
                if (!authToken) {
                    printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.", "error")
                    break
                }
                if (lastListedProducts.length === 0) {
                    printToTerminal(
                        "Error: Inventario sin conectar. Usá el comando 'listar' para cargar las existencias.",
                        "error",
                    )
                    break
                }
                const itemIndex = parseInt(commandParts[1], 10) - 1
                if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= lastListedProducts.length) {
                    printToTerminal("Error: Número de item inválido. Usá 'listar' para ver el inventario.", "error")
                    break
                }
                const productIdToInspect = lastListedProducts[itemIndex].id
                loadingMessageElement = await showLoadingMessage(`Inspeccionando item #${itemIndex + 1}...`)
                const inspectResponse = await fetch(`${API_URL}/products/${productIdToInspect}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                })
                loadingMessageElement.remove()
                const product = await inspectResponse.json()
                printProductDetails(product)
            } catch (error) {
                printToTerminal(
                    "Error de conexión: No se pudo comunicar con el servidor del búnker. ¿Está el servidor iniciado?",
                )
            }
                break

            case "crear":
                if (!authToken) {
                    printToTerminal("Error: Se requiere iniciar sesión.", "error")
                    break
                }
                if (userRole !== "admin") {
                    printToTerminal("Acceso denegado. Se requieren permisos de administrador.", "error")
                    break
                }
                if (commandParts.length < 7) {
                    printToTerminal(
                        "Error: Faltan parámetros. Usá 'ayuda crear' para ver el formato correcto.",
                        "error",
                    )
                    break
                }
                const newProductData = {
                    name: commandParts[1],
                    category: commandParts[2],
                    description: commandParts[3],
                    price: parseInt(commandParts[4], 10),
                    stock: parseInt(commandParts[5], 10),
                    imageUrl: commandParts[6],
                }
                loadingMessageElement = await showLoadingMessage("Registrando nuevo item en la base de datos...")
                const createResponse = await fetch(`${API_URL}/products/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify(newProductData),
                })
                loadingMessageElement.remove()
                const createdProduct = await createResponse.json()
                if (createResponse.ok) {
                    printToTerminal("Nuevo item agregado al inventario:", "success")
                    printProductDetails(createdProduct)
                } else {
                    printToTerminal(`Error al crear: ${createdProduct.message}`, "error")
                }
                break

            case "actualizar":
            case "eliminar":
                if (!authToken) {
                    printToTerminal("Error: Se requiere iniciar sesión.", "error")
                    break
                }
                if (userRole !== "admin") {
                    printToTerminal("Acceso denegado. Se requieren permisos de administrador.", "error")
                    break
                }
                if (lastListedProducts.length === 0) {
                    printToTerminal(
                        "Error: Inventario sin conectar. Usá el comando 'listar' para cargar las existencias.",
                        "error",
                    )
                    break
                }

                const actionItemIndex = parseInt(commandParts[1], 10) - 1
                if (isNaN(actionItemIndex) || actionItemIndex < 0 || actionItemIndex >= lastListedProducts.length) {
                    printToTerminal("Error: Número de item inválido. Usá 'listar' para ver el inventario.", "error")
                    break
                }
                const productIdToAction = lastListedProducts[actionItemIndex].id

                pendingAction = {
                    action: mainCommand,
                    productId: productIdToAction,
                    args: commandParts.slice(2),
                }
                printToTerminal(
                    `ADVERTENCIA: Esta acción modificará la base de datos de forma irreversible.`,
                    "loading",
                )
                printToTerminal(`¿Estás seguro de que querés continuar? (S/N)`)
                break

        case "actualizar":
            default:
                printToTerminal(
                    `Comando '${command}' no reconocido. Escribí 'ayuda' para ver la lista de comandos.`,
                    "error",
                )
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
            } else {
                printToTerminal(`Error al actualizar: ${updatedProduct.message}`, "error")
            }
        } else if (action === "eliminar") {
            loadingMessageElement = await showLoadingMessage(`Eliminando item con ID: ${productId}...`)
            const deleteResponse = await fetch(`${API_URL}/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            })
            loadingMessageElement.remove()
            const result = await deleteResponse.json()
            if (deleteResponse.ok) {
                printToTerminal(result.message, "success")
            } else {
                printToTerminal(`Error al eliminar: ${result.message}`, "error")
            }
        }
    } catch (error) {
        if (loadingMessageElement) loadingMessageElement.remove()
        printToTerminal("Error al ejecutar la operación. Verificá los parámetros y tu conexión.", "error")
    }
}

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault()
        const command = input.value
        handleCommand(command)
        input.value = ""
    } else if (event.key === "ArrowUp") {
        event.preventDefault()
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++
            input.value = commandHistory[historyIndex]
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault()
        if (historyIndex > 0) {
            historyIndex--
            input.value = commandHistory[historyIndex]
        } else {
            historyIndex = -1
            input.value = ""
        }
    }
})

terminal.addEventListener("click", () => {
    input.focus()
})

// Foco inicial al cargar la página
input.focus()
