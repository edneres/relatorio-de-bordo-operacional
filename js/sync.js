/*
=========================================================
SINCRONIZAÇÃO DE PDFs
=========================================================

Responsável pela comunicação entre:

IndexedDB
    ↓
Site Relatório
    ↓
Cloudflare Worker
    ↓
Google Drive (posteriormente)

=========================================================
*/


const URL_API =
    "https://site-relatorio-api.rboregionalleste.workers.dev";


/*
=========================================================
ENVIAR PDF PARA TESTE
=========================================================

Nesta etapa:

- envia o PDF ao Worker;
- envia os metadados;
- verifica a resposta;
- NÃO altera o status do PDF;
- NÃO remove o PDF da fila.

=========================================================
*/

async function enviarPDFTeste(
    registroPDF
) {

    if (!registroPDF) {

        throw new Error(
            "Registro de PDF não informado."
        );

    }


    if (!registroPDF.arquivoPDF) {

        throw new Error(
            "O registro não possui o arquivo PDF."
        );

    }


    /*
    =========================================
    MONTA FORMULÁRIO
    =========================================
    */

    const formulario =
        new FormData();


    formulario.append(
        "id",
        registroPDF.id || ""
    );


    formulario.append(
        "categoria",
        registroPDF.categoria || ""
    );


    formulario.append(
        "subcategoria",
        registroPDF.subcategoria || ""
    );


    formulario.append(
        "incidente",
        registroPDF.incidente || ""
    );


    formulario.append(
        "instalacao",
        registroPDF.instalacao || ""
    );


    formulario.append(
        "localidade",
        registroPDF.localidade || ""
    );


    formulario.append(
        "nomeAcao",
        registroPDF.nomeAcao || ""
    );


    /*
    =========================================
    ARQUIVO PDF
    =========================================
    */

    formulario.append(
        "arquivo",
        registroPDF.arquivoPDF,
        registroPDF.nomeArquivo ||
            "relatorio.pdf"
    );


    /*
    =========================================
    ENVIA PARA O WORKER
    =========================================
    */

    const resposta =
        await fetch(
            URL_API + "/upload",
            {
                method: "POST",
                body: formulario
            }
        );


    /*
    Não definimos Content-Type manualmente.

    O navegador precisa adicionar automaticamente
    o boundary utilizado pelo multipart/form-data.
    */


    let dados;


    try {

        dados =
            await resposta.json();

    }
    catch (erro) {

        throw new Error(
            "A API retornou uma resposta inválida."
        );

    }


    /*
    =========================================
    VERIFICA RESPOSTA HTTP
    =========================================
    */

    if (!resposta.ok) {

        throw new Error(
            dados.erro ||
            (
                "Erro HTTP " +
                resposta.status
            )
        );

    }


    /*
    =========================================
    VERIFICA RESPOSTA DA API
    =========================================
    */

    if (!dados.sucesso) {

        throw new Error(
            dados.erro ||
            "O Worker não confirmou o recebimento."
        );

    }


    console.log(
        "PDF recebido pelo Worker:",
        dados
    );


    return dados;

}


/*
=========================================================
TESTAR PRIMEIRO PDF PENDENTE
=========================================================

Função temporária para utilizarmos pelo Console
do navegador.

=========================================================
*/

async function testarEnvioPrimeiroPDF() {

    console.log(
        "Procurando PDFs pendentes..."
    );


    const pendentes =
        await listarPDFsPendentes();


    if (
        !pendentes ||
        pendentes.length === 0
    ) {

        console.log(
            "Nenhum PDF pendente encontrado."
        );

        return null;

    }


    const registro =
        pendentes[0];


    console.log(
        "PDF selecionado para teste:",
        {
            id:
                registro.id,

            nomeArquivo:
                registro.nomeArquivo,

            tamanho:
                registro.arquivoPDF
                    ? registro.arquivoPDF.size
                    : 0,

            status:
                registro.status
        }
    );


    try {

        const resultado =
            await enviarPDFTeste(
                registro
            );


        console.log(
            "TESTE CONCLUÍDO COM SUCESSO.",
            resultado
        );


        return resultado;

    }
    catch (erro) {

        console.error(
            "FALHA NO TESTE DE ENVIO:",
            erro
        );


        throw erro;

    }

}