
const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

const {
    beforeRunHook,
    afterRunHook
} = require("cypress-mochawesome-reporter/lib");

module.exports = defineConfig({
    reporter: "cypress-mochawesome-reporter",

    reporterOptions: {
        reportDir: "cypress/reports",
        overwrite: false,
        html: true,
        json: true,
        charts: true,
        saveJson: true,
        embeddedScreenshots: true,
        inlineAssets: true
    },

    e2e: {
       baseUrl: "http://127.0.0.1:5500/QA%20Test%20Center",
        setupNodeEvents(on, config) {
            // Mantener las credenciales fuera del código.
            config.env.MOODLE_USER = process.env.MOODLE_USER;
            config.env.MOODLE_PASSWORD = process.env.MOODLE_PASSWORD;

            on("before:run", async (details) => {
                // IMPORTANTE:
                // No borrar cypress/screenshots.
                // Así se conservan las capturas de ejecuciones anteriores.
                await beforeRunHook(details);
            });

            on("after:run", async (results) => {
                await afterRunHook(results);

                if (!results) return;

                const carpeta = path.join(
                    config.projectRoot,
                    "cypress",
                    "reports"
                );

                const carpetaScreenshots = path.join(
                    config.projectRoot,
                    "cypress",
                    "screenshots"
                );

                fs.mkdirSync(carpeta, { recursive: true });

                // Buscar el informe HTML más reciente sin borrar los anteriores.
                const informes = fs.readdirSync(carpeta)
                    .filter((nombre) => /^index(?:_\d+)?\.html$/i.test(nombre))
                    .map((nombre) => ({
                        nombre,
                        ruta: path.join(carpeta, nombre),
                        fecha: fs.statSync(
                            path.join(carpeta, nombre)
                        ).mtimeMs
                    }))
                    .sort((a, b) => b.fecha - a.fecha);

                if (informes.length > 0) {
                    const ultimoInforme = path.join(
                        carpeta,
                        "ultimo-informe.html"
                    );

                    fs.copyFileSync(
                        informes[0].ruta,
                        ultimoInforme
                    );

                    console.log(
                        "Último informe guardado:",
                        ultimoInforme
                    );
                }

                // Recopilar las pruebas de la ejecución actual.
                const tests = [];

                if (Array.isArray(results.runs)) {
                    results.runs.forEach((run) => {
                        if (!Array.isArray(run.tests)) return;

                        run.tests.forEach((test) => {
                            let estado = "Pendiente";

                            if (test.state === "passed") {
                                estado = "PASS";
                            } else if (test.state === "failed") {
                                estado = "FAIL";
                            } else if (
                                test.state === "pending" ||
                                test.state === "skipped"
                            ) {
                                estado = "Pendiente";
                            }

                            const titulo = Array.isArray(test.title)
                                ? test.title.join(" > ")
                                : String(test.title || "Prueba sin título");

                            const coincidencia = titulo.match(/TC-\d+/i);

                            tests.push({
                                id: coincidencia
                                    ? coincidencia[0].toUpperCase()
                                    : "SIN-ID",

                                titulo,
                                tituloCompleto: titulo,
                                estado,
                                archivo: run.spec
                                    ? (run.spec.relative || run.spec.name || "")
                                    : "",
                                duracion: test.duration || 0,
                                evidencia: null
                            });
                        });
                    });
                }

                const total = tests.length;
                const pass = tests.filter(
                    (test) => test.estado === "PASS"
                ).length;
                const fail = tests.filter(
                    (test) => test.estado === "FAIL"
                ).length;
                const pendientes = tests.filter(
                    (test) => test.estado === "Pendiente"
                ).length;

                const fechaEjecucion = new Date().toLocaleString("es-AR");
                const porcentajeExito = total > 0
                    ? Math.round((pass / total) * 100)
                    : 0;

                // Estructura compatible con el informe de QA Test Center.
                const datos = {
                    total,
                    totalTests: total,
                    passed: pass,
                    pass,
                    failed: fail,
                    fail,
                    pending: pendientes,
                    pendientes,
                    skipped: results.totalSkipped || 0,
                    fecha: fechaEjecucion,
                    fechaEjecucion,
                    porcentajeExito,
                    tests
                };

                const archivoResultados = path.join(
                    carpeta,
                    "qa-results.json"
                );

                fs.writeFileSync(
                    archivoResultados,
                    JSON.stringify(datos, null, 2),
                    "utf8"
                );

                // Registrar las capturas que existen, sin eliminarlas.
                const evidencias = [];

                function buscarCapturas(carpetaActual) {
                    if (!fs.existsSync(carpetaActual)) return;

                    const elementos = fs.readdirSync(
                        carpetaActual,
                        { withFileTypes: true }
                    );

                    elementos.forEach((elemento) => {
                        const rutaCompleta = path.join(
                            carpetaActual,
                            elemento.name
                        );

                        if (elemento.isDirectory()) {
                            buscarCapturas(rutaCompleta);
                        } else if (
                            elemento.isFile() &&
                            elemento.name.toLowerCase().endsWith(".png")
                        ) {
                            const rutaRelativa = path.relative(
                                config.projectRoot,
                                rutaCompleta
                            );

                            evidencias.push({
                                archivo: rutaRelativa.replace(/\\/g, "/"),
                                nombre: elemento.name
                            });
                        }
                    });
                }

                buscarCapturas(carpetaScreenshots);

                const archivoEvidencias = path.join(
                    carpeta,
                    "qa-evidencias.json"
                );

                fs.writeFileSync(
                    archivoEvidencias,
                    JSON.stringify({
                        fecha: fechaEjecucion,
                        total: evidencias.length,
                        evidencias
                    }, null, 2),
                    "utf8"
                );

                console.log("");
                console.log("======================================");
                console.log(" RESULTADOS QA TEST CENTER");
                console.log("======================================");
                console.log("Total:", total);
                console.log("PASS:", pass);
                console.log("FAIL:", fail);
                console.log("Pendientes:", pendientes);
                console.log("Éxito:", porcentajeExito + "%");
                console.log("Capturas conservadas:", evidencias.length);
                console.log("Resultados:", archivoResultados);
                console.log("Evidencias:", archivoEvidencias);
                console.log("======================================");
            });

            return config;
        }
    }
});