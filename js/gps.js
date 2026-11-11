/*
=========================================
OBTER LOCALIZAÇÃO GPS
=========================================
*/


function obterLocalizacaoGPS() {

    return new Promise(function (resolve) {

        const falha = {
            sucesso: false,
            latitude: null,
            longitude: null,
            precisao: null
        };

        if (!navigator.geolocation) {
            resolve(falha);
            return;
        }

        navigator.geolocation.getCurrentPosition(

            function (posicao) {

                const latitude = posicao.coords.latitude;
                const longitude = posicao.coords.longitude;

                const coordenadasValidas =
                    Number.isFinite(latitude) &&
                    Number.isFinite(longitude) &&
                    latitude >= -90 &&
                    latitude <= 90 &&
                    longitude >= -180 &&
                    longitude <= 180;

                if (!coordenadasValidas) {
                    resolve(falha);
                    return;
                }

                resolve({
                    sucesso: true,
                    latitude: latitude,
                    longitude: longitude,
                    precisao: posicao.coords.accuracy
                });
            },

            function (erro) {

                console.warn(
                    "Não foi possível obter o GPS:",
                    erro
                );

                resolve(falha);
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}


/*
=========================================
FORMATAR COORDENADA
=========================================
*/

function formatarCoordenada(valor, tipo) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return null;

    }


    let direcao;


    if (tipo === "latitude") {

        direcao =
            valor >= 0
                ? "N"
                : "S";

    }

    else {

        direcao =
            valor >= 0
                ? "E"
                : "W";

    }


    const valorAbsoluto =
        Math.abs(valor);


    return (
        valorAbsoluto.toFixed(8)
        +
        "° "
        +
        direcao
    );

}


/*
=========================================
FORMATAR LINHA DE COORDENADAS
=========================================
*/

function formatarCoordenadas(
    latitude,
    longitude
) {

    const latitudeFormatada =
        formatarCoordenada(
            latitude,
            "latitude"
        );


    const longitudeFormatada =
        formatarCoordenada(
            longitude,
            "longitude"
        );


    if (
        !latitudeFormatada ||
        !longitudeFormatada
    ) {

        return null;

    }


    return (
        latitudeFormatada
        +
        "  "
        +
        longitudeFormatada
    );

}


/*
=========================================
BUSCAR MUNICÍPIO E UF
=========================================

Esta informação é OPCIONAL.

Qualquer problema de:

- internet;
- servidor;
- conexão lenta;
- timeout;
- resposta inválida;
- localização não encontrada;

resultará simplesmente em:

{
    municipio: null,
    uf: null
}

Nenhum erro será apresentado ao usuário.
=========================================
*/

async function buscarMunicipioUF(
    latitude,
    longitude
) {

    /*
    -----------------------------------------
    VERIFICA CONEXÃO
    -----------------------------------------
    */

    if (!navigator.onLine) {

        return {
            municipio: null,
            uf: null
        };

    }


    /*
    -----------------------------------------
    CONTROLADOR DE TIMEOUT
    -----------------------------------------
    */

    const controlador =
        new AbortController();


    /*
        Se o serviço não responder rapidamente,
        abandonamos a consulta.

        Município/UF não deve atrasar o fluxo
        principal da aplicação.
    */

    const timeout =
        setTimeout(function () {

            controlador.abort();

        }, 3500);


    try {

        /*
        -----------------------------------------
        CONSULTA DE GEOCODIFICAÇÃO REVERSA
        -----------------------------------------
        */

        const url =

            "https://nominatim.openstreetmap.org/reverse"
            +
            "?format=jsonv2"
            +
            "&lat="
            +
            encodeURIComponent(latitude)
            +
            "&lon="
            +
            encodeURIComponent(longitude)
            +
            "&zoom=10"
            +
            "&addressdetails=1"
            +
            "&accept-language=pt-BR";


        const resposta =
            await fetch(
                url,
                {
                    method: "GET",

                    signal:
                        controlador.signal,

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!resposta.ok) {

            return {
                municipio: null,
                uf: null
            };

        }


        const dados =
            await resposta.json();


        /*
        -----------------------------------------
        ENDEREÇO
        -----------------------------------------
        */

        const endereco =
            dados.address || {};


        /*
            Dependendo do local, o Nominatim
            pode retornar a cidade em campos
            diferentes.

            Tentamos em ordem de prioridade.
        */

        const municipio =

            endereco.city
            ||
            endereco.town
            ||
            endereco.municipality
            ||
            endereco.village
            ||
            endereco.county
            ||
            null;


        /*
        -----------------------------------------
        UF
        -----------------------------------------

        No Brasil normalmente podemos obter
        a sigla através de ISO3166-2-lvl4:

        BR-PI
        BR-MA
        BR-CE
        etc.
        */

        let uf = null;


        const codigoISO =
            endereco[
                "ISO3166-2-lvl4"
            ];


        if (
            codigoISO &&
            codigoISO.startsWith("BR-")
        ) {

            uf =
                codigoISO.substring(3);

        }


        /*
            Fallback caso a propriedade ISO
            não esteja disponível.
        */

        if (
            !uf &&
            endereco.state_code
        ) {

            uf =
                endereco.state_code
                    .replace("BR-", "")
                    .toUpperCase();

        }


        /*
        -----------------------------------------
        RESULTADO
        -----------------------------------------
        */

        return {

            municipio:
                municipio,

            uf:
                uf

        };

    }

    catch (erro) {

        /*
            TOTALMENTE SILENCIOSO.

            Inclusive AbortError por timeout.

            Não mostramos alert().
            Não interrompemos a aplicação.
        */

        return {

            municipio: null,

            uf: null

        };

    }

    finally {

        clearTimeout(
            timeout
        );

    }

}