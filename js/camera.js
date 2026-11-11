/*
=========================================
CONTROLE DE GPS DA CÂMERA
=========================================
*/

let cameraEmVerificacao = false;
let gpsCameraAutorizado = false;
let gpsCameraBloqueado = false;

function exibirAvisoGPS() {

    let aviso = document.getElementById(
        "aviso-bloqueio-gps"
    );

    if (!aviso) {

        aviso = document.createElement("div");
        aviso.id = "aviso-bloqueio-gps";

        Object.assign(aviso.style, {
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: "99999"
        });

        const caixa = document.createElement("div");

        Object.assign(caixa.style, {
            background: "#ffffff",
            color: "#222222",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
        });

        const titulo = document.createElement("h2");
        titulo.textContent = "⚠️ Localização indisponível";
        titulo.style.marginTop = "0";

        const mensagem = document.createElement("p");
        mensagem.textContent =
            "Não foi possível obter as coordenadas " +
            "geográficas do dispositivo. " +
            "O registro de fotografias foi bloqueado.";

        const orientacao = document.createElement("p");
        orientacao.textContent =
            "Verifique se o GPS está ativado e se " +
            "a permissão de localização foi concedida. " +
            "Feche completamente a aplicação e " +
            "abra-a novamente.";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Entendi";

        Object.assign(botao.style, {
            padding: "12px 28px",
            border: "none",
            borderRadius: "8px",
            background: "#222222",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "15px"
        });

        botao.addEventListener("click", function () {
            aviso.remove();
        });

        caixa.append(
            titulo,
            mensagem,
            orientacao,
            botao
        );

        aviso.appendChild(caixa);
        document.body.appendChild(aviso);
    }
}


/*
=========================================
ABRIR CÂMERA
=========================================
*/

async function abrirCamera() {

    if (gpsCameraBloqueado) {
        exibirAvisoGPS();
        return;
    }

    if (cameraEmVerificacao) {
        return;
    }

    const inputCamera = document.getElementById(
        "input-camera"
    );

    if (!inputCamera) {
        console.error("Campo da câmera não encontrado.");
        return;
    }

    cameraEmVerificacao = true;

    try {

        const localizacao = await obterLocalizacaoGPS();

        if (!localizacao.sucesso) {

            gpsCameraBloqueado = true;
            gpsCameraAutorizado = false;

            exibirAvisoGPS();
            return;
        }

        gpsCameraAutorizado = true;

        inputCamera.value = "";
        inputCamera.click();

    } catch (erro) {

        console.error("Erro na verificação GPS:", erro);

        gpsCameraBloqueado = true;
        gpsCameraAutorizado = false;

        exibirAvisoGPS();

    } finally {

        cameraEmVerificacao = false;
    }
}


/*
=========================================
CONFIGURAR CÂMERA
=========================================
*/

function configurarCamera() {

    const inputCamera = document.getElementById(
        "input-camera"
    );

    if (!inputCamera) {
        console.error("Campo da câmera não encontrado.");
        return;
    }

    inputCamera.addEventListener(
        "change",
        async function (event) {

            const arquivo = event.target.files[0];

            if (!arquivo) {
                gpsCameraAutorizado = false;
                return;
            }

            if (
                gpsCameraBloqueado ||
                !gpsCameraAutorizado
            ) {
                inputCamera.value = "";
                exibirAvisoGPS();
                return;
            }

            gpsCameraAutorizado = false;

            if (!arquivo.type.startsWith("image/")) {
                alert("O arquivo selecionado não é uma imagem.");
                inputCamera.value = "";
                return;
            }

            await adicionarFotografia(arquivo);

            inputCamera.value = "";
        }
    );
}
