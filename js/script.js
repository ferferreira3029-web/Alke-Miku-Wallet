$(document).ready(function() {
    console.log("Alke Miku Wallet - System CV-01 Online");

    // ==========================================
    // CONFIGURACIÓN Y UTILIDADES
    // ==========================================
    
    //Función para alertas//
    const appendAlert = (message, type) => {
        const container = $('#alert-container');
        if (container.length === 0) return;
        const alertHtml = $(`
            <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        container.empty().append(alertHtml);
        setTimeout(() => { alertHtml.fadeOut(500, function() { $(this).remove(); }); }, 3000);
    };
 //*Formato clp*//
    const fmt = (val) => "$" + Number(val).toLocaleString('es-CL');

    //Sincronizar saldos//
    function syncSaldo() {
        const saldo = Number(localStorage.getItem("saldo")) || 60000;
        $("#saldo, #saldoActual").text(fmt(saldo));
    }
    syncSaldo();

    // ==========================================
    // LOGIN (index.html)
    // ==========================================
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const pass = $('#password').val();

        if (email === "admin@gmail.com" && pass === "1234") {
            if (localStorage.getItem("saldo") === null) localStorage.setItem("saldo", 60000);
            window.location.href = 'menu.html';
        } else {
            appendAlert("Credenciales incorrectas.", "danger");
        }
    });

// ==========================================
// DEPÓSITOS
// ==========================================
$('#depositForm').on('submit', function(e) {
    e.preventDefault();
    const monto = Number($("#depositAmount").val());
    if (monto <= 0) return;

    //Elementos del botón//
    const btn = $("#btnConfirmarDeposito");
    const spinner = $("#spinner");
    const btnText = $("#btnText");

    //Iniciar estado de carga//
    btn.prop("disabled", true); // Bloquea el botón
    spinner.removeClass("d-none"); // Muestra el spinner
    btnText.text(" Procesando..."); // Cambia el texto

    setTimeout(() => {
        let saldoActual = Number(localStorage.getItem("saldo")) || 60000;
        let nuevoSaldo = saldoActual + monto;
        localStorage.setItem("saldo", nuevoSaldo);

        let movs = JSON.parse(localStorage.getItem("movimientos")) || [];
        movs.push({
            tipo: "Depósito",
            monto: monto,
            fecha: new Date().toLocaleString(),
            saldo: nuevoSaldo
        });
        localStorage.setItem("movimientos", JSON.stringify(movs));

        window.location.href = 'menu.html';
    }, 1500);
});

    // ==========================================
    // ENVÍO Y CONTACTOS (sendmoney.html)
    // ==========================================
    
    //Mostrar formulario nuevo contacto//
    $(document).on('click', '#btnMostrarFormulario', function() {
        $('#contenedorFormularioContacto').removeClass('d-none').addClass('animate__animated animate__fadeIn');
        $(this).addClass('d-none');
    });

    $(document).on('click', '#btnCancelarContacto', function() {
        $('#contenedorFormularioContacto').addClass('d-none');
        $('#btnMostrarFormulario').removeClass('d-none');
    });

    $(document).on('click', '#guardarContacto', function() {
        const nombre = $('#nombreContacto').val();
        if (!nombre) { appendAlert("Nombre necesario", "warning"); return; }
        const item = `
            <li class="list-group-item item-contacto animate__animated animate__fadeInLeft">
                <input type="radio" name="contacto" class="form-check-input me-2">
                <strong>${nombre}</strong> <br>
                <small class="text-muted">Banco: ${$('#bancoContacto').val() || 'Alke Bank'}</small>
            </li>`;
        $('#contactList').prepend(item);
        $('#contenedorFormularioContacto').addClass('d-none');
        $('#btnMostrarFormulario').removeClass('d-none');
        appendAlert("Contacto guardado", "success");
    });

    $(document).on('change', 'input[name="contacto"]', function() {
        $('#btnConfirmarEnvio').removeClass('d-none').addClass('animate__animated animate__fadeInUp');
    });

    $('#formEnviar').on('submit', function(e) {
    e.preventDefault();
    const monto = Number($("#montoEnviar").val());
    const saldoActual = Number(localStorage.getItem("saldo")) || 0;
    const contactoCheck = $('input[name="contacto"]:checked');

    if (monto > saldoActual) {
        appendAlert("Saldo insuficiente.", "danger");
        return;
    }

    //Elementos del botón//
    const btn = $("#btnConfirmarEnvio");
    const spinner = $("#spinnerEnvio");
    const btnText = $("#btnTextEnvio");

    //Iniciar estado de carga//
    btn.prop("disabled", true);
    spinner.removeClass("d-none");
    btnText.text(" Enviando...");

    const nombreDestino = contactoCheck.closest('.item-contacto').find('strong').text();

    setTimeout(() => {
        let nuevoSaldo = saldoActual - monto;
        localStorage.setItem("saldo", nuevoSaldo);

        let movs = JSON.parse(localStorage.getItem("movimientos")) || [];
        movs.push({
            tipo: "Envío",
            monto: monto,
            contacto: nombreDestino,
            fecha: new Date().toLocaleString(),
            saldo: nuevoSaldo
        });
        localStorage.setItem("movimientos", JSON.stringify(movs));

        btnText.text(" ¡Éxito!");
        setTimeout(() => { window.location.href = "menu.html"; }, 800);
    }, 1800);
});

    // ==========================================
    // HISTORIAL (transactions.html)
    // ==========================================
    if ($("#listaMovimientosDinamica").length > 0) {
        function cargarHistorial(filtro = "todos") {
            const lista = $("#listaMovimientosDinamica");
            const movs = JSON.parse(localStorage.getItem("movimientos")) || [];
            lista.empty();

            if (movs.length === 0) {
                lista.append('<li class="list-group-item text-center text-muted">Aún no hay movimientos</li>');
                return;
            }

            //lo más reciente arriba//
            movs.reverse().forEach(m => {
                if (filtro !== "todos" && m.tipo !== filtro) return;
                
                const esEnvio = m.tipo === "Envío";
                const badgeClass = esEnvio ? "text-danger" : "text-success";
                const simbolo = esEnvio ? "-" : "+";

                lista.append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center animate__animated animate__fadeIn">
                        <div>
                            <small class="text-muted" style="font-size: 0.75rem;">${m.fecha}</small><br>
                            <strong>${m.tipo}</strong> 
                            ${m.contacto ? `<span class="text-secondary small">a ${m.contacto}</span>` : ''}
                        </div>
                        <div class="text-end">
                            <span class="fw-bold ${badgeClass}">${simbolo} ${fmt(m.monto)}</span><br>
                            <small class="text-muted" style="font-size: 0.7rem;">Saldo: ${fmt(m.saldo)}</small>
                        </div>
                    </li>
                `);
            });
        }


        $("#filtroTipo").on("change", function() {
            cargarHistorial($(this).val());
        });

        cargarHistorial(); 
    }

    // ==========================================
    // NAVEGACIÓN MANUAL (PARA BOTONES ID)
    // ==========================================
    $('#btnDepositar').on('click', () => window.location.href = "deposit.html");
    $('#btnEnviar').on('click', () => window.location.href = "sendmoney.html");
    $('#btnMovimientos').on('click', () => window.location.href = "transactions.html");
});