const terminal = document.getElementById("terminal");
const output = document.getElementById("output");
const input = document.getElementById("input");
const inputMirror = document.getElementById("input-mirror");
const cursor = document.getElementById("cursor");

let authToken = null;
const API_URL = "http://localhost:3000/api";
let lastListedProducts = [];
let commandHistory = [];
let historyIndex = -1;

function clearTerminal() {
    const headerContent = `
<pre>
********************************
*                              *
*      d88b  .o88b. d8b   db   *
*      `8P' d8P  Y8 888o  88   *
*       88  8P      88V8o 88   *
*       88  8b      88 V8o88   *
*   db. 88  Y8b  d8 88  V888   *
*   Y8888P   `Y88P' VP   V8P   *
*                              *
********************************
</pre>
                <div>Bunker Inventory System v1.0 :: Status | Conectado a la red</div>
                <div>Escribí 'ayuda' para ver los comandos disponibles.</div>
`;
    output.innerHTML = headerContent.trim();
}

function printToTerminal(text) {
    const newDiv = document.createElement("div");
    newDiv.innerHTML = text;
    output.appendChild(newDiv);
    terminal.scrollTop = terminal.scrollHeight;
}

function formatHelpLine(command, description) {
    const commandColor = "#66ff66";
    const fixedWidth = 30;
    const commandWithoutEntities = command.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const coloredCommand = `<span style="color: ${commandColor};">  ${command}</span>`;
    let padding = " ";

    if (fixedWidth > commandWithoutEntities.length) {
        padding = ".".repeat(fixedWidth - commandWithoutEntities.length);
    }
    return `${coloredCommand} ${padding} ${description}`;
}

function parseCommand(command) {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const parts = [];
    let match;
    while ((match = regex.exec(command))) {
        parts.push(match[1] || match[2] || match[0]);
    }
    return parts;
}

function printProductDetails(product) {
    printToTerminal(`--- Ficha de Item: ${product.name} ---`);
    printToTerminal(`  ID: ${product.id}`);
    printToTerminal(`  Descripción: ${product.description}`);
    printToTerminal(`  Precio: ${product.price} créditos`);
    printToTerminal(`  Stock: ${product.stock} unidades`);
    printToTerminal(`  Imagen: ${product.imageUrl}`);
}

async function handleCommand(command) {
    if (command.trim() === "") {
        return;
    }

    if (command.trim() !== "") {
        commandHistory.unshift(command);
    }
    historyIndex = -1;

    const commandParts = parseCommand(command);
    const mainCommand = commandParts[0];

    printToTerminal(`> ${command}`);

    switch (mainCommand) {
        case "ayuda":
            const subCommand = commandParts[1];
            if (subCommand) {
                switch (subCommand) {
                    case "login":
                        printToTerminal("Uso del comando 'login':");
                        printToTerminal("  login <email> <contraseña>");
                        printToTerminal("  Ej: login admin@bunker.com 123456");
                        break;
                    case "listar":
                        printToTerminal("Uso del comando 'listar':");
                        printToTerminal("  Muestra todos los productos del inventario.");
                        printToTerminal("  Requiere haber iniciado sesión.");
                        break;
                    case "inspeccionar":
                        printToTerminal("Uso del comando 'inspeccionar':");
                        printToTerminal("  inspeccionar <#>");
                        printToTerminal(
                            "  Muestra los detalles de un item usando su número de la lista (obtenido con 'listar').",
                        );
                        printToTerminal("  Ej: inspeccionar 1");
                        break;
                    case "crear":
                        printToTerminal("Uso del comando 'crear':");
                        printToTerminal('  crear "Nombre" "Descripción" <precio> <stock> <url_imagen>');
                        printToTerminal(
                            '  Ej: crear "Gafas de Visión Nocturna" "Para ver en la oscuridad total" 250 5 "url.com/img.png"',
                        );
                        break;
                    case "actualizar":
                        printToTerminal("Uso del comando 'actualizar':");
                        printToTerminal("  actualizar <#> <campo> <nuevo_valor>");
                        printToTerminal("  Campos válidos: name, description, price, stock, imageUrl.");
                        printToTerminal("  Ej: actualizar 2 stock 45");
                        break;
                    case "eliminar":
                        printToTerminal("Uso del comando 'eliminar':");
                        printToTerminal("  eliminar <#>");
                        printToTerminal("  Elimina un item del inventario usando su número de la lista.");
                        printToTerminal("  Ej: eliminar 3");
                        break;
                    default:
                        printToTerminal(`Comando 'ayuda ${subCommand}' no reconocido.`);
                        break;
                }
            } else {
                printToTerminal("Comandos disponibles:");
                printToTerminal(formatHelpLine("login &lt;email&gt; &lt;pass&gt;", "Inicia sesión en el sistema."));
                printToTerminal(formatHelpLine("listar", "Muestra el inventario."));
                printToTerminal(formatHelpLine("inspeccionar &lt;#&gt;", "Muestra detalles de un item."));
                printToTerminal(formatHelpLine('crear "&lt;nombre&gt;" ...', "Crea un nuevo item."));
                printToTerminal(formatHelpLine("actualizar &lt;#&gt; ...", "Actualiza un item."));
                printToTerminal(formatHelpLine("eliminar &lt;#&gt;", "Elimina un item del inventario."));
                printToTerminal(formatHelpLine("ayuda", "Muestra esta lista de comandos."));
                printToTerminal(formatHelpLine("ayuda &lt;comando&gt;", "Muestra ayuda para un comando específico."));
                printToTerminal(formatHelpLine("limpiar", "Limpia la pantalla de la terminal."));
            }
            break;

        case "login":
            const email = commandParts[1].toLowerCase();
            const password = commandParts[2];
            if (!email || !password) {
                printToTerminal("Error: Se requiere email y contraseña. Uso: login <email> <password>");
                break;
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    authToken = data.token;
                    printToTerminal("Login exitoso. Token de acceso almacenado.");
                } else {
                    printToTerminal(`Error de autenticación: ${data.message}`);
                }
            } catch (error) {
                printToTerminal("Error de conexión con el servidor.");
            }
            break;

        case "listar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.");
                break;
            }

            try {
                const response = await fetch(`${API_URL}/products`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const products = await response.json();
                lastListedProducts = products;

                printToTerminal("Inventario del Búnker:");
                products.forEach((p, i) => printToTerminal(`  <${i + 1}> [${p.id}] - ${p.name} (Stock: ${p.stock})`));
            } catch (error) {
                printToTerminal("Error al obtener el inventario.");
            }
            break;

        case "inspeccionar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión. Usá el comando 'login'.");
                break;
            }
            const itemIndex = parseInt(commandParts[1], 10) - 1;
            if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= lastListedProducts.length) {
                printToTerminal("Error: Número de item inválido. Usá 'listar' para ver el inventario.");
                break;
            }
            const productId = lastListedProducts[itemIndex].id;
            try {
                const response = await fetch(`${API_URL}/products/${productId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const product = await response.json();
                printProductDetails(product);
            } catch (error) {
                printToTerminal("Error al obtener los detalles del item.");
            }
            break;

        case "crear":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.");
                break;
            }
            const newProductData = {
                name: commandParts[1],
                description: commandParts[2],
                price: parseInt(commandParts[3], 10),
                stock: parseInt(commandParts[4], 10),
                imageUrl: commandParts[5],
            };
            try {
                const response = await fetch(`${API_URL}/products/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify(newProductData),
                });
                const createdProduct = await response.json();
                printToTerminal("Nuevo item agregado al inventario:");
                printProductDetails(createdProduct);
            } catch (error) {
                printToTerminal("Error al crear el item.");
            }
            break;

        case "actualizar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.");
                break;
            }
            const updateIndex = parseInt(commandParts[1], 10) - 1;
            const updateField = commandParts[2];
            let updateValue = commandParts[3];
            if (updateField === "price" || updateField === "stock") {
                updateValue = parseInt(updateValue, 10);
            }
            try {
                const updateProductId = lastListedProducts[updateIndex].id;
                const response = await fetch(`${API_URL}/products/${updateProductId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ [updateField]: updateValue }),
                });
                const updatedProduct = await response.json();
                printToTerminal("Item actualizado:");
                printProductDetails(updatedProduct);
            } catch (error) {
                printToTerminal("Error al actualizar el item.");
            }
            break;

        case "eliminar":
            if (!authToken) {
                printToTerminal("Error: Se requiere iniciar sesión.");
                break;
            }
            const deleteIndex = parseInt(commandParts[1], 10) - 1;
            try {
                const deleteProductId = lastListedProducts[deleteIndex].id;
                const response = await fetch(`${API_URL}/products/${deleteProductId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const result = await response.json();
                printToTerminal(result.message);
            } catch (error) {
                printToTerminal("Error al eliminar el item.");
            }
            break;

        case "limpiar":
            clearTerminal();
            break;

        default:
            printToTerminal(`Comando '${command}' no reconocido. Escribí 'ayuda' para ver la lista de comandos.`);
            break;
    }
}

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const command = input.value;
        handleCommand(command);
        input.value = "";
        inputMirror.textContent = "";
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[historyIndex];
            inputMirror.textContent = input.value;
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[historyIndex];
            inputMirror.textContent = input.value;
        } else {
            historyIndex = -1;
            input.value = "";
            inputMirror.textContent = "";
        }
    }
});

input.addEventListener("input", () => {
    inputMirror.textContent = input.value;
});

terminal.addEventListener("click", () => {
    input.focus();
});

input.addEventListener("focus", () => {
    cursor.textContent = "█";
    cursor.classList.add("blinking");
});

input.addEventListener("blur", () => {
    cursor.textContent = "_";
    cursor.classList.remove("blinking");
});

input.focus();
