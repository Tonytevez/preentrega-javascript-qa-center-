
const CLAVE_CASOS_QA = "qaTestCenterCasosV1";

let casosQA = [];
let casoEditandoId = null;

document.addEventListener("DOMContentLoaded", inicializarGestionTests);

function inicializarGestionTests() {
    const tabla = document.getElementById("tablaTests");
    if (!tabla) {
        console.warn("No se encontró la tabla tablaTests.");
        return;
    }

    const guardados = localStorage.getItem(CLAVE_CASOS_QA);

    if (guardados !== null) {
        try {
            casosQA = JSON.parse(guardados);
            if (!Array.isArray(casosQA)) casosQA = [];
        } catch (error) {
            console.error("No se pudieron leer los casos guardados:", error);
            casosQA = [];
        }
    } else {
        // Primera ejecución: conservar los casos que ya estaban en el HTML.
        casosQA = Array.from(tabla.querySelectorAll("tr")).map(fila => {
            const celdas = fila.querySelectorAll("td");
            if (celdas.length < 2) return null;

            const selectorEstado = fila.querySelector("select");
            const botonVer = fila.querySelector("button");
            const id = celdas[0].textContent.trim();
            const titulo = celdas[1].textContent.trim();

            if (!id || !titulo) return null;

            return {
                id,
                titulo,
                estado: selectorEstado ? selectorEstado.value : "Pendiente",
                objetivo: "",
                precondicion: "",
                pasos: "",
                esperado: "",
                detalleOriginal: botonVer ? true : false
            };
        }).filter(Boolean);

        guardarCasosQA();
    }

    renderizarCasosQA();
}

function guardarCasosQA() {
    localStorage.setItem(CLAVE_CASOS_QA, JSON.stringify(casosQA));
}

function renderizarCasosQA() {
    const tabla = document.getElementById("tablaTests");
    if (!tabla) return;

    tabla.replaceChildren();

    casosQA.forEach(caso => {
        const fila = document.createElement("tr");

        agregarCelda(fila, caso.id);
        agregarCelda(fila, caso.titulo);

        const celdaEstado = document.createElement("td");
        const selector = document.createElement("select");

        ["Pendiente", "PASS", "FAIL"].forEach(estado => {
            const opcion = document.createElement("option");
            opcion.value = estado;
            opcion.textContent = estado;
            selector.appendChild(opcion);
        });

        selector.value = caso.estado || "Pendiente";
        selector.className = "estado";
        selector.addEventListener("change", () => {
            caso.estado = selector.value;
            guardarCasosQA();
            actualizarContadoresQA();
        });

        celdaEstado.appendChild(selector);
        fila.appendChild(celdaEstado);

        const acciones = document.createElement("td");

        crearBoton(acciones, "Ver", "btn-ver", () => mostrarDetalle(caso.id));
        crearBoton(acciones, "Modificar", "btn-modificar", () => editarTest(caso.id));
        crearBoton(acciones, "Eliminar", "btn-eliminar", () => eliminarTest(caso.id));

        fila.appendChild(acciones);
        tabla.appendChild(fila);
    });

    actualizarContadoresQA();
}

function agregarCelda(fila, texto) {
    const celda = document.createElement("td");
    celda.textContent = texto || "";
    fila.appendChild(celda);
}

function crearBoton(contenedor, texto, clase, accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.className = clase;
    boton.addEventListener("click", accion);
    contenedor.appendChild(boton);
}

function mostrarNuevoTest() {
    casoEditandoId = null;

    const formulario = document.getElementById("nuevoTest");
    if (!formulario) return;

    formulario.style.display = "block";

    const titulo = formulario.querySelector("h2, h3, h4");
    if (titulo) titulo.textContent = "Nuevo caso de prueba";

    const botonGuardar = buscarBotonGuardar();
    if (botonGuardar) botonGuardar.textContent = "Guardar Test";

    limpiarFormulario();
    const campoId = document.getElementById("nuevoId");
    if (campoId) {
        campoId.disabled = false;
        campoId.focus();
    }
}

function editarTest(id) {
    const caso = casosQA.find(item => item.id === id);
    if (!caso) return;

    casoEditandoId = id;

    const formulario = document.getElementById("nuevoTest");
    if (!formulario) return;

    formulario.style.display = "block";

    const titulo = formulario.querySelector("h2, h3, h4");
    if (titulo) titulo.textContent = "Modificar caso de prueba";

    ponerValor("nuevoId", caso.id);
    ponerValor("nuevoTitulo", caso.titulo);
    ponerValor("nuevoObjetivo", caso.objetivo);
    ponerValor("nuevoPrecondicion", caso.precondicion);
    ponerValor("nuevoPasos", caso.pasos);
    ponerValor("nuevoEsperado", caso.esperado);

    // Permitir modificar el ID.
    const campoId = document.getElementById("nuevoId");
    if (campoId) {
        campoId.disabled = false;
        campoId.focus();
    }

    const botonGuardar = buscarBotonGuardar();
    if (botonGuardar) botonGuardar.textContent = "Guardar cambios";
}



function guardarTest() {
    const id = obtenerValor("nuevoId");
    const titulo = obtenerValor("nuevoTitulo");
    const objetivo = obtenerValor("nuevoObjetivo");
    const precondicion = obtenerValor("nuevoPrecondicion");
    const pasos = obtenerValor("nuevoPasos");
    const esperado = obtenerValor("nuevoEsperado");

    if (!id || !titulo || !objetivo || !precondicion || !pasos || !esperado) {
        alert("Completá todos los campos antes de guardar.");
        return;
    }

    if (casoEditandoId !== null) {
        const indice = casosQA.findIndex(item => item.id === casoEditandoId);

        if (indice === -1) {
            alert("No se encontró el caso que querés modificar.");
            return;
        }

        // Evitar IDs duplicados, sin comparar el caso que estamos editando.
        const idDuplicado = casosQA.some(
            (item, i) => i !== indice &&
                item.id.trim().toLowerCase() === id.toLowerCase()
        );

        if (idDuplicado) {
            alert("Ya existe otro caso con ese ID. Elegí uno diferente.");
            return;
        }

        casosQA[indice] = {
            ...casosQA[indice],
            id,
            titulo,
            objetivo,
            precondicion,
            pasos,
            esperado
        };
    } else {
        if (casosQA.some(item => item.id.trim().toLowerCase() === id.toLowerCase())) {
            alert("Ya existe un caso con ese ID. Usá otro identificador.");
            return;
        }

        casosQA.push({
            id,
            titulo,
            objetivo,
            precondicion,
            pasos,
            esperado,
            estado: "Pendiente"
        });
    }

    guardarCasosQA();
    renderizarCasosQA();
    cancelarNuevoTest();

    alert("Caso de prueba guardado correctamente.");
}


function eliminarTest(id) {
    const caso = casosQA.find(item => item.id === id);
    if (!caso) return;

    if (!confirm(`¿Querés eliminar el caso ${caso.id} - ${caso.titulo}?`)) {
        return;
    }

    casosQA = casosQA.filter(item => item.id !== id);
    guardarCasosQA();
    renderizarCasosQA();

    if (casoEditandoId === id) cancelarNuevoTest();
}

function limpiarEnsayos() {
    if (casosQA.length === 0) {
        alert("No hay casos de prueba para limpiar.");
        return;
    }

    const confirmar = confirm(
        "¿Querés quitar todos los casos del módulo Tests Cypress?\n\n" +
        "Esto no elimina los resultados, capturas ni informes guardados por Cypress."
    );

    if (!confirmar) return;

    casosQA = [];
    guardarCasosQA();
    renderizarCasosQA();
    cancelarNuevoTest();

    alert("Se quitaron los casos del listado. Los archivos de Cypress no se modificaron.");
}

function mostrarDetalle(id) {
    const caso = casosQA.find(item => item.id === id);
    if (!caso) return;

    ponerEnDetalle(["detalleId", "detalleID"], caso.id);
    ponerEnDetalle(["detalleTitulo"], caso.titulo);
    ponerEnDetalle(["detalleObjetivo"], caso.objetivo || "No cargado.");
    ponerEnDetalle(["detallePrecondicion", "detallePrecondición"], caso.precondicion || "No cargada.");
    ponerEnDetalle(["detallePasos"], caso.pasos || "No cargados.");
    ponerEnDetalle(["detalleEsperado", "detalleResultadoEsperado"], caso.esperado || "No cargado.");

    const ventana = document.getElementById("detalleTest");
    if (ventana) ventana.style.display = "block";
}

function ponerEnDetalle(ids, valor) {
    for (const id of ids) {
        const elemento = document.getElementById(id);
        if (!elemento) continue;

        if ("value" in elemento && elemento.tagName === "INPUT") {
            elemento.value = valor;
        } else {
            elemento.textContent = valor;
        }
    }
}

function cerrarDetalle() {
    const ventana = document.getElementById("detalleTest");
    if (ventana) ventana.style.display = "none";
}

function cancelarNuevoTest() {
    const formulario = document.getElementById("nuevoTest");
    if (formulario) formulario.style.display = "none";

    casoEditandoId = null;

    const campoId = document.getElementById("nuevoId");
    if (campoId) campoId.disabled = false;

    const titulo = formulario?.querySelector("h2, h3, h4");
    if (titulo) titulo.textContent = "Nuevo caso de prueba";

    const botonGuardar = buscarBotonGuardar();
    if (botonGuardar) botonGuardar.textContent = "Guardar Test";

    limpiarFormulario();
}

function limpiarFormulario() {
    [
        "nuevoId",
        "nuevoTitulo",
        "nuevoObjetivo",
        "nuevoPrecondicion",
        "nuevoPasos",
        "nuevoEsperado"
    ].forEach(id => ponerValor(id, ""));
}

function ponerValor(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.value = valor ?? "";
}

function obtenerValor(id) {
    return (document.getElementById(id)?.value || "").trim();
}

function buscarBotonGuardar() {
    const formulario = document.getElementById("nuevoTest");
    if (!formulario) return null;

    return formulario.querySelector(
        'button[onclick*="guardarTest"], button[type="submit"]'
    );
}

function actualizarContadoresQA() {
    const total = casosQA.length;
    const pass = casosQA.filter(caso => caso.estado === "PASS").length;
    const fail = casosQA.filter(caso => caso.estado === "FAIL").length;
    const pendientes = casosQA.filter(caso => !caso.estado || caso.estado === "Pendiente").length;

    // Actualizar solo los contadores existentes en la página.
    actualizarTextoSiExiste("totalTests", total);
    actualizarTextoSiExiste("totalCasos", total);
    actualizarTextoSiExiste("testsPass", pass);
    actualizarTextoSiExiste("testsFail", fail);
    actualizarTextoSiExiste("testsPendientes", pendientes);

    // Compatibilidad con los identificadores usados por el tablero actual.
    // Los informes automáticos siguen leyendo sus archivos JSON de Cypress.
    const totalPruebas = document.getElementById("totalPruebas");
    if (totalPruebas) totalPruebas.textContent = total;

    const exitosas = document.getElementById("pruebasExitosas");
    if (exitosas) exitosas.textContent = pass;

    const fallidas = document.getElementById("pruebasFallidas");
    if (fallidas) fallidas.textContent = fail;
}

function actualizarTextoSiExiste(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}
async function cargarCasosAutomaticosCypress() {
    const tabla = document.getElementById("tablaTests");
    if (!tabla) return;

    try {
        const respuesta = await fetch(
            "cypress/reports/qa-results.json?ts=" + Date.now()
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo leer qa-results.json");
        }

        const datos = await respuesta.json();
        const tests = Array.isArray(datos.tests) ? datos.tests : [];

        // Evitar duplicar la sección al volver a cargar resultados.
        tabla.querySelectorAll(".fila-cypress, .separador-cypress")
            .forEach(fila => fila.remove());

        const separador = document.createElement("tr");
        separador.className = "separador-cypress";

        const celdaSeparador = document.createElement("td");
        celdaSeparador.colSpan = 4;
        celdaSeparador.textContent = "RESULTADOS AUTOMÁTICOS DE CYPRESS";
        celdaSeparador.style.fontWeight = "bold";
        celdaSeparador.style.textAlign = "center";

        separador.appendChild(celdaSeparador);
        tabla.appendChild(separador);

        if (tests.length === 0) {
            const fila = document.createElement("tr");
            fila.className = "fila-cypress";

            const celda = document.createElement("td");
            celda.colSpan = 4;
            celda.textContent = "Todavía no hay ejecuciones de Cypress registradas.";

            fila.appendChild(celda);
            tabla.appendChild(fila);
            return;
        }

        tests.forEach(test => {
            const fila = document.createElement("tr");
            fila.className = "fila-cypress";

            const id = test.id || "Cypress";
            const titulo = test.tituloCompleto || test.titulo || test.nombre || id;
            const estadoOriginal = String(test.estado || "Pendiente").toUpperCase();

            let estado = "Pendiente";
            if (["PASS", "PASSED", "PASSING"].includes(estadoOriginal)) {
                estado = "PASS";
            } else if (["FAIL", "FAILED", "FAILING"].includes(estadoOriginal)) {
                estado = "FAIL";
            } else if (["PENDING", "PENDIENTE", "SKIPPED"].includes(estadoOriginal)) {
                estado = "Pendiente";
            }

            [id, titulo, estado].forEach(texto => {
                const celda = document.createElement("td");
                celda.textContent = texto;
                fila.appendChild(celda);
            });

            const accion = document.createElement("td");
            accion.textContent = "Generado por Cypress";
            fila.appendChild(accion);

            tabla.appendChild(fila);
        });
    } catch (error) {
        console.error("Error cargando casos automáticos de Cypress:", error);
    }
}

document.addEventListener("DOMContentLoaded", cargarCasosAutomaticosCypress);

