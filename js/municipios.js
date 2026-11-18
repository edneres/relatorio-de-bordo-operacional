/*
=========================================
MUNICÍPIO / UF OFFLINE
=========================================

Identifica o município e a UF a partir da
coordenada do GPS, sem internet, usando a
malha municipal oficial do IBGE armazenada
em data/municipios.json (MA e PI).

Funcionamento:

1. A base é carregada uma única vez e
   mantida em memória.
2. Para cada município, verifica primeiro
   o retângulo envolvente (rápido).
3. Somente nos candidatos, verifica se o
   ponto está dentro do polígono.

Coordenadas armazenadas como inteiros
(graus x 10.000) para reduzir o arquivo.
=========================================
*/

const URL_BASE_MUNICIPIOS = "./data/municipios.json";


let promessaBaseMunicipios = null;


/*
=========================================
CARREGAR BASE DE MUNICÍPIOS
=========================================

A promessa fica guardada: chamadas
simultâneas aproveitam o mesmo carregamento.

Em caso de falha, a promessa é descartada
para permitir nova tentativa depois.
=========================================
*/

function carregarBaseMunicipios() {

    if (promessaBaseMunicipios) {

        return promessaBaseMunicipios;

    }


    promessaBaseMunicipios =
        fetch(
            URL_BASE_MUNICIPIOS
        )

            .then(
                function (resposta) {

                    if (!resposta.ok) {

                        throw new Error(
                            "Base de municípios indisponível."
                        );

                    }

                    return resposta.json();

                }
            )

            .catch(
                function (erro) {

                    promessaBaseMunicipios = null;

                    throw erro;

                }
            );


    return promessaBaseMunicipios;

}


/*
=========================================
PONTO DENTRO DO POLÍGONO
=========================================

Algoritmo do raio (par/ímpar).

Considera todos os anéis do polígono:
o contorno externo e eventuais "buracos"
(áreas de outro município no interior).
=========================================
*/

function pontoDentroPoligono(
    x,
    y,
    aneis
) {

    let dentro = false;


    for (
        let a = 0;
        a < aneis.length;
        a++
    ) {

        const anel =
            aneis[a];

        const total =
            anel.length;


        for (
            let i = 0, j = total - 2;
            i < total;
            j = i, i += 2
        ) {

            const xi = anel[i];
            const yi = anel[i + 1];

            const xj = anel[j];
            const yj = anel[j + 1];


            const cruza =
                (yi > y) !== (yj > y)
                &&
                x <
                    (xj - xi) *
                    (y - yi) /
                    (yj - yi)
                    +
                    xi;


            if (cruza) {

                dentro = !dentro;

            }

        }

    }


    return dentro;

}


/*
=========================================
IDENTIFICAR MUNICÍPIO / UF OFFLINE
=========================================

Retorna:

{ municipio: "Caxias", uf: "MA" }

ou, fora da área coberta ou em falha:

{ municipio: null, uf: null }
=========================================
*/

async function identificarMunicipioOffline(
    latitude,
    longitude
) {

    const vazio = {
        municipio: null,
        uf: null
    };


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return vazio;

    }


    let base;


    try {

        base =
            await carregarBaseMunicipios();

    }

    catch (erro) {

        console.warn(
            "Base local de municípios indisponível:",
            erro
        );

        return vazio;

    }


    const escala =
        base.escala || 10000;


    /*
    Mesma escala dos dados armazenados.
    */

    const x =
        longitude * escala;

    const y =
        latitude * escala;


    const municipios =
        base.municipios || [];


    for (
        let m = 0;
        m < municipios.length;
        m++
    ) {

        const municipio =
            municipios[m];

        const caixa =
            municipio.b;


        /*
        -----------------------------------------
        FILTRO RÁPIDO: RETÂNGULO ENVOLVENTE
        -----------------------------------------
        */

        if (
            x < caixa[0] ||
            y < caixa[1] ||
            x > caixa[2] ||
            y > caixa[3]
        ) {

            continue;

        }


        /*
        -----------------------------------------
        VERIFICAÇÃO EXATA: POLÍGONOS
        -----------------------------------------
        */

        const poligonos =
            municipio.p;


        for (
            let p = 0;
            p < poligonos.length;
            p++
        ) {

            if (
                pontoDentroPoligono(
                    x,
                    y,
                    poligonos[p]
                )
            ) {

                return {

                    municipio:
                        municipio.n,

                    uf:
                        municipio.u

                };

            }

        }

    }


    return vazio;

}


/*
=========================================
PRÉ-CARREGAMENTO
=========================================

Carrega a base em segundo plano assim que
a página termina de abrir, para que a
primeira fotografia não espere a leitura.
=========================================
*/

window.addEventListener(
    "load",
    function () {

        carregarBaseMunicipios()

            .catch(
                function () {

                    /*
                    Silencioso: nova tentativa
                    ocorre na primeira fotografia.
                    */

                }
            );

    }
);
