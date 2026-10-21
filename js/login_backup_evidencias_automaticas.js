let contadorTests = 4;


/* ==========================================
   LOGIN
   ========================================== */

function ingresar() {

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;
    const mensaje = document.getElementById("mensaje");

    if (usuario === "TR7" && password === "Scorpion27") {

        document.getElementById("login").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        mensaje.textContent = "";

    } else {

        mensaje.textContent = "Usuario o contraseña incorrectos.";

    }
}


/* ==========================================
ENTER PARA INGRESAR
   ========================================== */
document.addEventListener("DOMContentLoaded", function () {

    const password = document.getElementById("password");

    if (password) {

        password.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                ingresar();
            }

        });

    }


    const botonInforme =
        document.getElementById("btnGenerarInforme");

    if (botonInforme) {

        botonInforme.addEventListener(
            "click",
            generarInforme
        );

    }


    cargarResultadosCypress();
    cargarEvidenciasCypress();

}); 
/* ==========================================
    CERRAR SESIÓN
   ========================================== */

function cerrarSesion() {

    document.getElementById("dashboard").style.display = "none";
    document.getElementById("login").style.display = "block";

    document.getElementById("usuario").value = "";
    document.getElementById("password").value = "";
    document.getElementById("mensaje").textContent = "";

}


/* ==========================================
   MOSTRAR MÓDULOS
   ========================================== */

function mostrarModulo(modulo) {

    document.getElementById("moduloTests").style.display = "none";
    document.getElementById("moduloResultados").style.display = "none";
    document.getElementById("moduloEvidencias").style.display = "none";
    document.getElementById("moduloInformes").style.display = "none";


    if (modulo === "tests") {

        document.getElementById("moduloTests").style.display = "block";

    }


    if (modulo === "resultados") {

        document.getElementById("moduloResultados").style.display = "block";

        cargarResultadosCypress();

    }


    if (modulo === "evidencias") {

        document.getElementById("moduloEvidencias").style.display = "block";

        cargarEvidenciasCypress();

    }


    if (modulo === "informes") {

        document.getElementById("moduloInformes").style.display = "block";

        cargarResultadosCypress();

    }

}


/* ==========================================
   NUEVO TEST
   ========================================== */

function mostrarNuevoTest() {

    const formulario = document.getElementById("nuevoTest");

    formulario.style.display = "block";

    formulario.scrollIntoView({
        behavior: "smooth"
    });

    document.getElementById("nuevoId").focus();

}


function cancelarNuevoTest() {

    document.getElementById("nuevoTest").style.display = "none";

    limpiarFormulario();

}


function limpiarFormulario() {

    document.getElementById("nuevoId").value = "";
    document.getElementById("nuevoTitulo").value = "";
    document.getElementById("nuevoObjetivo").value = "";
    document.getElementById("nuevoPrecondicion").value = "";
    document.getElementById("nuevoPasos").value = "";
    document.getElementById("nuevoEsperado").value = "";

}


/* ==========================================
   GUARDAR TEST
   ========================================== */

function guardarTest() {

    const id = document.getElementById("nuevoId").value.trim();
    const titulo = document.getElementById("nuevoTitulo").value.trim();
    const objetivo = document.getElementById("nuevoObjetivo").value.trim();
    const precondicion = document.getElementById("nuevoPrecondicion").value.trim();
    const pasos = document.getElementById("nuevoPasos").value.trim();
    const esperado = document.getElementById("nuevoEsperado").value.trim();


    if (
        id === "" ||
        titulo === "" ||
        objetivo === "" ||
        precondicion === "" ||
        pasos === "" ||
        esperado === ""
    ) {

        alert("Completá todos los campos.");

        return;

    }


    const tabla = document.getElementById("tablaTests");

    const fila = document.createElement("tr");


    fila.innerHTML = `
        <td>${id}</td>

        <td>${titulo}</td>

        <td>
            <select
                class="estado estado-pendiente"
                onchange="actualizarEstado(this)"
            >
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="Pendiente" selected>Pendiente</option>
            </select>
        </td>

        <td>
            <button
                class="btn-ver"
                onclick="mostrarDetalle('${id}')"
            >
                Ver
            </button>
        </td>
    `;


    tabla.appendChild(fila);

    contadorTests++;


    document.getElementById("totalPruebas").textContent =
        contadorTests;


    document.getElementById("nuevoTest").style.display =
        "none";


    limpiarFormulario();

    actualizarContadores();


    alert("Caso de prueba guardado correctamente.");

}


/* ==========================================
   ACTUALIZAR ESTADO
   ========================================== */

function actualizarEstado(select) {

    select.classList.remove(
        "estado-pass",
        "estado-fail",
        "estado-pendiente"
    );


    if (select.value === "PASS") {

        select.classList.add("estado-pass");

    }

    else if (select.value === "FAIL") {

        select.classList.add("estado-fail");

    }

    else {

        select.classList.add("estado-pendiente");

    }


    actualizarContadores();

    actualizarResultados();

}


/* ==========================================
   ACTUALIZAR RESULTADOS MANUALES
   ========================================== */

function actualizarResultados() {

    const filasTests =
        document.querySelectorAll("#tablaTests tr");

    const filasResultados =
        document.querySelectorAll("#tablaResultados tr");


    filasTests.forEach(function (filaTest, indice) {

        const estado =
            filaTest.querySelector(".estado");

        if (!estado) {
            return;
        }


        const filaResultado =
            filasResultados[indice];


        if (filaResultado) {

            const celdaEstado =
                filaResultado.querySelector(".resultado-estado");


            if (celdaEstado) {

                celdaEstado.textContent =
                    estado.value;

            }

        }

    });

}


/* ==========================================
   ACTUALIZAR CONTADORES
   ========================================== */

function actualizarContadores() {

    const estados =
        document.querySelectorAll(".estado");


    let pass = 0;
    let fail = 0;


    estados.forEach(function (select) {

        if (select.value === "PASS") {
            pass++;
        }

        if (select.value === "FAIL") {
            fail++;
        }

    });


    document.getElementById("totalPruebas").textContent =
        estados.length;

    document.getElementById("pruebasExitosas").textContent =
        pass;

    document.getElementById("pruebasFallidas").textContent =
        fail;

}


/* ==========================================
   DETALLE DEL TEST
   ========================================== */

function mostrarDetalle(id) {

    document.getElementById("detalleTest").style.display =
        "flex";


    document.getElementById("detalleId").textContent =
        id;


    const titulos = {

        "TC-001": "Login válido",

        "TC-002": "Usuario incorrecto",

        "TC-003": "Contraseña incorrecta",

        "TC-004": "Campos obligatorios"

    };


    document.getElementById("detalleTitulo").textContent =
        titulos[id] || "Nuevo caso de prueba";


    if (id === "TC-001") {

        document.getElementById("detalleObjetivo").textContent =
            "Validar que un usuario registrado pueda iniciar sesión correctamente.";

        document.getElementById("detallePrecondicion").textContent =
            "El sistema debe estar disponible y el usuario debe estar registrado.";

        document.getElementById("detallePasos").textContent =
            "1. Ingresar usuario TR7.\n2. Ingresar contraseña.\n3. Presionar Ingresar.";

        document.getElementById("detalleEsperado").textContent =
            "El sistema debe permitir el acceso al Dashboard.";

    }


    else if (id === "TC-002") {

        document.getElementById("detalleObjetivo").textContent =
            "Validar el comportamiento cuando se ingresa un usuario incorrecto.";

        document.getElementById("detallePrecondicion").textContent =
            "Encontrarse en la pantalla de login.";

        document.getElementById("detallePasos").textContent =
            "1. Ingresar un usuario incorrecto.\n2. Ingresar contraseña.\n3. Presionar Ingresar.";

        document.getElementById("detalleEsperado").textContent =
            "El sistema debe informar que el usuario o contraseña son incorrectos.";

    }


    else if (id === "TC-003") {

        document.getElementById("detalleObjetivo").textContent =
            "Validar el comportamiento cuando se ingresa una contraseña incorrecta.";

        document.getElementById("detallePrecondicion").textContent =
            "Encontrarse en la pantalla de login.";

        document.getElementById("detallePasos").textContent =
            "1. Ingresar usuario correcto.\n2. Ingresar contraseña incorrecta.\n3. Presionar Ingresar.";

        document.getElementById("detalleEsperado").textContent =
            "El sistema debe rechazar el acceso.";

    }


    else if (id === "TC-004") {

        document.getElementById("detalleObjetivo").textContent =
            "Validar que el sistema controle los campos obligatorios.";

        document.getElementById("detallePrecondicion").textContent =
            "Encontrarse en la pantalla de login.";

        document.getElementById("detallePasos").textContent =
            "1. Dejar usuario vacío.\n2. Dejar contraseña vacía.\n3. Presionar Ingresar.";

        document.getElementById("detalleEsperado").textContent =
            "El sistema debe solicitar completar los campos obligatorios.";

    }

}


/* ==========================================
   CERRAR DETALLE
   ========================================== */

function cerrarDetalle() {

    document.getElementById("detalleTest").style.display =
        "none";

}


/* ==========================================
GENERAR INFORME
   ========================================== */

function generarInforme() {

    const ruta =
        "cypress/reports/ultimo-informe.html";

    window.open(ruta, "_blank");

}


/* ==========================================
CARGAR RESULTADOS REALES DE CYPRESS
   ========================================== */

function cargarResultadosCypress() {

    fetch("cypress/reports/qa-results.json")

        .then(function (response) {

            if (!response.ok) {
                throw new Error("No se pudo cargar qa-results.json");
            }

            return response.json();

        })

        .then(function (datos) {

            const informeTotal =
                document.getElementById("informeTotal");

            const informePass =
                document.getElementById("informePass");

            const informeFail =
                document.getElementById("informeFail");

            const informePendientes =
                document.getElementById("informePendientes");


            if (informeTotal) {
                informeTotal.textContent = datos.total;
            }

            if (informePass) {
                informePass.textContent = datos.passed;
            }

            if (informeFail) {
                informeFail.textContent = datos.failed;
            }

            if (informePendientes) {
                informePendientes.textContent = datos.pending;
            }


            let resultadosQA = {

                "TC-001": null,
                "TC-002": null,
                "TC-003": null,
                "TC-004": null

            };


            datos.tests.forEach(function (test) {

                const titulo = test.titulo || "";
                const spec = test.spec || "";


                if (
                    spec === "login.cy.js" &&
                    titulo.includes("TC-002 - Usuario incorrecto")
                ) {

                    resultadosQA["TC-002"] = test;

                }


                if (
                    spec === "login.cy.js" &&
                    titulo.includes("TC-003 - Contraseña incorrecta")
                ) {

                    resultadosQA["TC-003"] = test;

                }


                if (
                    spec === "login.cy.js" &&
                    titulo.includes("TC-004 - Campos obligatorios")
                ) {

                    resultadosQA["TC-004"] = test;

                }


                if (
                    spec === "QA Test Center.cy.js" &&
                    titulo.includes("TC-001:")
                ) {

                    resultadosQA["TC-001"] = test;

                }

            });


            const filas =
                document.querySelectorAll("#tablaResultados tr");


            filas.forEach(function (fila) {

                const celdaID =
                    fila.querySelector("td:first-child");

                const celdaEstado =
                    fila.querySelector(".resultado-estado");


                if (!celdaID || !celdaEstado) {
                    return;
                }


                const id =
                    celdaID.textContent.trim();

                const resultado =
                    resultadosQA[id];


                if (resultado) {

                    celdaEstado.textContent =
                        resultado.resultado;

                    celdaEstado.setAttribute(
                        "data-duracion",
                        resultado.duracion + " ms"
                    );

                }

            });


            console.log(
                "Resultados reales de QA cargados:",
                resultadosQA
            );

        })

        .catch(function (error) {

            console.error(
                "Error cargando resultados Cypress:",
                error
            );

        });

}


/* ==========================================
   CARGAR EVIDENCIAS REALES DE CYPRESS
   ========================================== */

function cargarEvidenciasCypress() {

    Promise.all([

        fetch("cypress/reports/qa-evidencias.json")

            .then(function (response) {

                if (!response.ok) {
                    throw new Error(
                        "No se pudo cargar qa-evidencias.json"
                    );
                }

                return response.json();

            }),

        fetch("cypress/reports/qa-results.json")

            .then(function (response) {

                if (!response.ok) {
                    throw new Error(
                        "No se pudo cargar qa-results.json"
                    );
                }

                return response.json();

            })

    ])

    .then(function (datos) {

        const evidencias = datos[0];
        const resultados = datos[1];

        const contenedor =
            document.getElementById("evidenciasGrid");

        if (!contenedor) {
            return;
        }

        const resultadosQA = {};

        resultados.tests.forEach(function (test) {

            const titulo = test.titulo || "";

            const coincidencia =
                titulo.match(/TC-\d+/);

            if (coincidencia) {

                const id =
                    coincidencia[0];

                resultadosQA[id] =
                    test.resultado;

            }

        });

        const evidenciasOrdenadas =
            evidencias.evidencias.slice().sort(function (a, b) {

                const idA =
                    (a.nombre.match(/TC-\d+/) || ["TC-999"])[0];

                const idB =
                    (b.nombre.match(/TC-\d+/) || ["TC-999"])[0];

                return (
                    parseInt(idA.split("-")[1], 10) -
                    parseInt(idB.split("-")[1], 10)
                );

            });

        contenedor.innerHTML = "";

        evidenciasOrdenadas.forEach(function (evidencia) {

            const coincidencia =
                evidencia.nombre.match(/TC-\d+/);

            if (!coincidencia) {
                return;
            }

            const id =
                coincidencia[0];

            const nombreBase =
                evidencia.nombre
                    .replace(".png", "");

            const partes =
                nombreBase.split("-");

            let titulo =
                partes.slice(2).join(" ");

            titulo =
                titulo
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, function (letra) {
                        return letra.toUpperCase();
                    });

            if (id === "TC-003") {
                titulo = "Contraseña incorrecta";
            }

            const estado =
                resultadosQA[id] || "Pendiente";

            let claseEstado =
                "estado-pendiente";

            if (estado === "PASS") {

                claseEstado =
                    "estado-pass";

            } else if (estado === "FAIL") {

                claseEstado =
                    "estado-fail";

            }

            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "evidencia-card";

            tarjeta.innerHTML = `

                <h3>${id}</h3>

                <p>${titulo}</p>

                <span class="evidencia-estado ${claseEstado}">
                    ${estado}
                </span>

                <div class="evidencia-archivo">

                    <img
                        src="${evidencia.archivo}"
                        alt="Evidencia ${id} ${titulo}"
                        class="imagen-evidencia"
                    >

                </div>

            `;

            contenedor.appendChild(tarjeta);

        });

        console.log(
            "Evidencias automáticas cargadas:",
            resultadosQA
        );

    })

    .catch(function (error) {

        console.error(
            "Error cargando evidencias y resultados:",
            error
        );

    });

}