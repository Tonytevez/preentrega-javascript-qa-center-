


const fs = require("fs");
const path = require("path");

const carpeta = path.join(__dirname, "cypress", "reports");
const carpetaJson = carpeta;
const archivoSalida = path.join(carpeta, "qa-results.json");
const carpetaCapturas = path.join(__dirname, "cypress", "screenshots");

// Leer archivos JSON.
function leerJson(ruta) {
    try {
        return JSON.parse(fs.readFileSync(ruta, "utf8"));
    } catch (error) {
        console.error(
            `No se pudo leer ${path.basename(ruta)}:`,
            error.message
        );
        return null;
    }
}

// Corregir textos que tengan codificación dañada.
function repararTexto(texto) {
    if (typeof texto !== "string") return texto;

    let resultado = texto;

    for (let i = 0; i < 2 && /Ã|Â/.test(resultado); i++) {
        const reparado = Buffer.from(resultado, "latin1").toString("utf8");

        if (reparado.includes("\uFFFD") || reparado === resultado) {
            break;
        }

        resultado = reparado;
    }

    return resultado;
}

// Determinar el estado de cada prueba.
function obtenerEstado(test) {
    const estado = String(test.state || "").toLowerCase();

    if (
        estado === "failed" ||
        test.fail === true ||
        test.passed === false
    ) {
        return "FAIL";
    }

    if (
        test.pending === true ||
        test.skipped === true ||
        estado === "pending" ||
        estado === "skipped"
    ) {
        return "Pendiente";
    }

    if (
        estado === "passed" ||
        test.pass === true ||
        test.passed === true
    ) {
        return "PASS";
    }

    return "Pendiente";
}

// Buscar la captura correspondiente al ID exacto del caso.
function buscarEvidencia(id) {
    if (!id || id === "SIN-ID" || !fs.existsSync(carpetaCapturas)) {
        return null;
    }

    const archivos = [];

    function recorrer(carpetaActual) {
        let elementos;

        try {
            elementos = fs.readdirSync(carpetaActual, {
                withFileTypes: true
            });
        } catch (error) {
            return;
        }

        for (const elemento of elementos) {
            const ruta = path.join(carpetaActual, elemento.name);

            if (elemento.isDirectory()) {
                recorrer(ruta);
            } else if (
                elemento.isFile() &&
                /\.(png|jpg|jpeg|webp)$/i.test(elemento.name)
            ) {
                archivos.push(ruta);
            }
        }
    }

    recorrer(carpetaCapturas);

    const patron = new RegExp(
        `(?:^|[^A-Z0-9])${id}(?:[^A-Z0-9]|$)`,
        "i"
    );

    const coincidencia = archivos.find(ruta =>
        patron.test(path.basename(ruta))
    );

    if (!coincidencia) return null;

    return path.relative(__dirname, coincidencia)
        .split(path.sep)
        .join("/");
}

// Extraer pruebas de las suites de Cypress.
function extraerTests(suites, archivoFuente, acumulado = []) {
    if (!Array.isArray(suites)) return acumulado;

    for (const suite of suites) {
        const pruebas = Array.isArray(suite.tests)
            ? suite.tests
            : [];

        for (const test of pruebas) {
            const titulo = repararTexto(
                test.title || "Prueba sin título"
            );

            const tituloCompleto = repararTexto(
                test.fullTitle || titulo
            );

            // Priorizar el título de la prueba para identificar su ID.
            const coincidencia =
                titulo.match(/\bTC-\d+\b/i) ||
                tituloCompleto.match(/\bTC-\d+\b/i);

            const id = coincidencia
                ? coincidencia[0].toUpperCase()
                : "SIN-ID";

            acumulado.push({
                id,
                titulo,
                tituloCompleto,
                estado: obtenerEstado(test),
                archivo: archivoFuente,
                duracion: test.duration || 0,
                evidencia: buscarEvidencia(id)
            });
        }

        extraerTests(suite.suites, archivoFuente, acumulado);
    }

    return acumulado;
}

// Generar el informe para QA Test Center.
function generarResultados() {
    const pruebas = [];

    // Buscar automáticamente el informe más reciente de Cypress.
const archivosReportes = fs.readdirSync(carpeta)
    .filter(nombre => /^index(?:_\d+)?\.json$/i.test(nombre))
    .map(nombre => ({
        nombre,
        fecha: fs.statSync(path.join(carpeta, nombre)).mtimeMs
    }))
    .sort((a, b) => b.fecha - a.fecha);

if (archivosReportes.length === 0) {
    console.error("No se encontraron informes JSON de Cypress.");
    return;
}

const reporteActual = path.join(carpeta, archivosReportes[0].nombre);

console.log("Informe de Cypress utilizado:", archivosReportes[0].nombre);

const contenido = leerJson(reporteActual);

    if (!contenido) {
        console.error("No se pudieron leer los resultados de Cypress.");
        return;
    }

    const resultados = Array.isArray(contenido.results)
        ? contenido.results
        : [];

    for (const resultado of resultados) {
        const archivoFuente =
            resultado.file ||
            resultado.fullFile ||
            "Archivo no identificado";

        extraerTests(
            [resultado],
            archivoFuente,
            pruebas
        );
    }

    const pass = pruebas.filter(
        test => test.estado === "PASS"
    ).length;

    const fail = pruebas.filter(
        test => test.estado === "FAIL"
    ).length;

    const pendientes = pruebas.filter(
        test => test.estado === "Pendiente"
    ).length;

    const total = pruebas.length;
    const fecha = new Date().toLocaleString("es-AR");

    const datos = {
        total,
        totalTests: total,
        passed: pass,
        pass,
        failed: fail,
        fail,
        pending: pendientes,
        pendientes,
        skipped: pendientes,
        porcentajeExito: total > 0
            ? Math.round((pass / total) * 100)
            : 0,
        fecha,
        fechaEjecucion: fecha,
        tests: pruebas
    };

    fs.mkdirSync(carpeta, { recursive: true });

    fs.writeFileSync(
        archivoSalida,
        JSON.stringify(datos, null, 2),
        "utf8"
    );

    console.log("");
    console.log("======================================");
    console.log(" RESULTADOS DE CYPRESS PARA QA CENTER");
    console.log("======================================");
    console.log("Total:", total);
    console.log("PASS:", pass);
    console.log("FAIL:", fail);
    console.log("Pendientes:", pendientes);
    console.log(
        "Pruebas con evidencia:",
        pruebas.filter(test => test.evidencia).length
    );
    console.log(
        "Pruebas sin evidencia:",
        pruebas.filter(test => !test.evidencia).length
    );
    console.log("Archivo:", archivoSalida);
    console.log("======================================");
}

generarResultados();
