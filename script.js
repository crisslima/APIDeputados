let campoNome = document.querySelector("#nome");
let campoLegislaturas = document.querySelector("#selectLegislaturas");
let campoSigla = document.querySelector("#sigla");
let campoDataInicial = document.querySelector("#dataInicial");
let campoDataFinal = document.querySelector("#dataFinal");
let url = "https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome";
let currentOpenDeputadoId = null;
let listaDeputadosAbertos = [];

document.addEventListener("DOMContentLoaded", function (event) {
    retornaLegislaturas();
});

function retornaLegislaturas() {
    let request = new XMLHttpRequest();

    request.open("GET", `https://dadosabertos.camara.leg.br/api/v2/legislaturas?ordem=DESC&ordenarPor=id`, true);
    request.onload = function (e) {
        if (request.readyState === 4) {
            if (request.status === 200) {
                listaLegislaturas(request.response.dados);
            } else {
                alert("Erro ao abrir requisição: " + request.statusText);
            }
        }
    };
    request.onerror = function (e) {
        alert("Erro: " + request.statusText);
    };
    request.responseType = "json"; //peço para a api retornar os dados no formato json
    request.send(null);
}

function retornaDeputados(event) {
    event.preventDefault();
    let request = new XMLHttpRequest();

    let filtrosUrl = "";
    if (campoNome.value !== "") {
        filtrosUrl += '&nome=' + campoNome.value;
    }
    if (campoSigla.value !== "") {
        filtrosUrl += '&siglaPartido=' + campoSigla.value;
    }
    if (campoDataInicial.value !== "") {
        filtrosUrl += '&dataInicio=' + campoDataInicial.value;
    }
    if (campoDataFinal.value !== "") {
        filtrosUrl += '&dataFim=' + campoDataFinal.value;
    }

    if (campoLegislaturas.value !== "") {
        filtrosUrl += '&idLegislatura=' + campoLegislaturas.value;
    }

    request.open("GET", url + filtrosUrl, true); //abre a conexão - false quer dizer que quero uma requisição sincrona
    request.onload = function (e) {
        /*verifica se a operação de conexao foi concluida com exito */
        if (request.readyState === 4) {
            if (request.status === 200) {
                listaDeputadosAccordion(request.response.dados);
            } else {
                alert("Erro ao abrir requisição: " + request.statusText);
            }
        }
    };
    request.onerror = function (e) {
        alert("Erro: " + request.statusText);
    };
    request.responseType = "json"; //peço para a api retornar os dados no formato json
    request.send(null);
}

function listaLegislaturas(jsonList) {
    let legislaturas = document.querySelector(`#selectLegislaturas`);
    let select;

    select += `<select>`;
    select += `  <option value="" selected>Selecione uma Legislatura</option>`;
    jsonList.forEach((legislatura, i) => {
        select += `<option value="${legislatura.id}">${legislatura.id}</option>`;
    })
    select += '</select>';
    legislaturas.innerHTML = select; //faz inserção do codigo html no campoPaises
}

function listaDeputadosAccordion(jsonList) {
    accordionDeputados.innerHTML = '';
    let accordion = '';

    let campoTextoResultado = document.querySelector(`#textoResultado`);

    if (jsonList.length > 0) {
        campoTextoResultado.innerText = "Resultado da Busca:"
    } else {
        campoTextoResultado.innerText = "A Busca não retornou dados."
    }


    jsonList.forEach((deputado) => {
        accordion += `<div class="accordion-item">`;
        accordion += `  <h2 class="accordion-header" id="heading${deputado.id}">`;
        accordion += `  <button onclick="exibeDespesasDeputado(${deputado.id},'${deputado.siglaPartido}')" class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${deputado.id}" aria-expanded="false" aria-controls="collapse${deputado.id}">`;
        accordion += deputado.nome + ' - ' + (deputado.siglaPartido != null ? deputado.siglaPartido : "Partido não informado");//`Accordion Item${index}#`;
        accordion += `  </button>`;
        accordion += `  </h2>`;
        accordion += `  <div id="collapse${deputado.id}" class="accordion-collapse collapse" aria-labelledby="heading${deputado.id}" data-bs-parent="#accordionDeputados">`;
        accordion += `      <div class="accordion-body">`;
        accordion += `          <div class="container">`;
        accordion += `              <div class="row">`;
        accordion += `                  <div class="col-sm-2 d-flex align-items-center images">`;
        accordion += `                      <img src="${deputado.urlFoto}" onerror="this.src='images/blank-profile.png'" alt="Imagem não disponível" width="114px" height="auto">`;
        accordion += `                  </div>`;
        accordion += `                  <div id="deputadoDetails${deputado.id}" class="col-sm-4">`;
        accordion += `                  </div>`;
        accordion += `                  <div id="deputadoDespesasDetails${deputado.id}" class="col-sm-4">`;
        accordion += `                  </div>`;
        accordion += `              </div>`;
        accordion += `          </div>`;
        accordion += `      </div>`;
        accordion += `  </div>`;
        accordion += '</div>';
    });

    accordionDeputados.innerHTML = accordion;
}

async function exibeDespesasDeputado(idDeputado, siglaPartido) {
    //alert("Id Deputado: " + id);
    if (currentOpenDeputadoId == idDeputado || listaDeputadosAbertos.includes(idDeputado)) {//includes verifica se o codigo esta dentro do array.nao funciona para objeto
        return;
    }

    currentOpenDeputadoId = idDeputado;
    listaDeputadosAbertos.push(idDeputado);//insere deputado no array para não precisar fazer as requisicoes para os deputados que ja tiveram suas informações acessadas

    retornaDetalhesDeputados(idDeputado);
    retornaDespesasDeputado(idDeputado);
    if (siglaPartido) {
        let partido = await retornaInformacoesPartido(siglaPartido);
        if (partido) {
            let detalhesPartido = await retornaDetalhesPartido(partido.id);
            if (detalhesPartido) {
                listaDetalhesPartido(detalhesPartido, idDeputado);
            }
        }
    }
}

async function retornaInformacoesPartido(siglaPartido) {
    return new Promise((resolve) => {
        let request = new XMLHttpRequest();

        request.open("GET", `https://dadosabertos.camara.leg.br/api/v2/partidos?sigla=${siglaPartido}`, true); //abre a conexão - false quer dizer que quero uma requisição sincrona
        request.onload = function (e) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    if (request.response.dados.length > 0) {
                        resolve(request.response.dados[0]);
                    } else {
                        resolve(null);
                    }
                } else {
                    alert("Erro ao abrir requisição: " + request.statusText);
                    resolve(null);
                }
            }
        };
        request.onerror = function (e) {
            alert("Erro: " + request.statusText);
            resolve(null);
        };
        request.responseType = "json"; //peço para a api retornar os dados no formato json
        request.send(null);
    });
}

async function retornaDetalhesPartido(idPartido) {
    return new Promise((resolve) => {
        let request = new XMLHttpRequest();

        request.open("GET", `https://dadosabertos.camara.leg.br/api/v2/partidos/${idPartido}`, true); //abre a conexão - false quer dizer que quero uma requisição sincrona
        request.onload = function (e) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    resolve(request.response.dados);
                } else {
                    alert("Erro ao abrir requisição: " + request.statusText);
                    resolve(null);
                }
            }
        };
        request.onerror = function (e) {
            alert("Erro: " + request.statusText);
            resolve(null);
        };
        request.responseType = "json"; //peço para a api retornar os dados no formato json
        request.send(null);
    });
}

function retornaDetalhesDeputados(idDeputado) {
    let request = new XMLHttpRequest();

    request.open("GET", `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}`, true); //abre a conexão - false quer dizer que quero uma requisição sincrona
    request.onload = function (e) {
        if (request.readyState === 4) {
            if (request.status === 200) {
                listaDetalhesDeputados(request.response.dados);
            } else {
                alert("Erro ao abrir requisição: " + request.statusText);
            }
        }
    };
    request.onerror = function (e) {
        alert("Erro: " + request.statusText);
    };
    request.responseType = "json"; //peço para a api retornar os dados no formato json
    request.send(null);
}

function listaDetalhesDeputados(dados) {

    let detalhesDeputado = document.querySelector(`#deputadoDetails${dados.id}`);
    detalhesDeputado.innerHTML = '';

    let nomeEleitoral = dados.ultimoStatus.nomeEleitoral != null ? dados.ultimoStatus.nomeEleitoral : "Não consta";
    let dataNascimento = dados.dataNascimento != null ? moment(dados.dataNascimento).format("DD/MM/YYYY") : "Não consta";
    let dataFalecimento = dados.dataFalecimento != null ? moment(dados.dataFalecimento).format("DD/MM/YYYY") : "Não consta";
    let naturalidade = dados.municipioNascimento != null ? dados.municipioNascimento + `/${dados.ufNascimento}` : "Não consta";
    let escolaridade = dados.escolaridade != null ? dados.escolaridade : "Não consta";
    let condicaoEleitoral = dados.ultimoStatus.condicaoEleitoral != null ? dados.ultimoStatus.condicaoEleitoral : "Não consta";
    let cargo = dados.ultimoStatus.descricaoStatus != null ? dados.ultimoStatus.descricaoStatus : "Não consta";
    let email = dados.ultimoStatus.email != null ? dados.ultimoStatus.email : "Não consta";
    let emailGabinete = dados.ultimoStatus.gabinete.email != null ? dados.ultimoStatus.gabinete.email : "Não consta";

    detalhesDeputado.innerHTML += `<div><b>Nome Civil:</b> ${dados.nomeCivil}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Nome Eleitoral:</b> ${dados.id} - ${nomeEleitoral}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Data Nascimento:</b>  ${dataNascimento}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Data Falecimento:</b>  ${dataFalecimento}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Naturalidade:</b>  ${naturalidade}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Escolaridade:</b>  ${escolaridade}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Condição Eleitoral:</b>  ${condicaoEleitoral}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Legislatura:</b>  ${dados.ultimoStatus.idLegislatura}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Cargo/Ocupação:</b>  ${cargo}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Email:</b>  ${email}</div>`;
    detalhesDeputado.innerHTML += `<div><b>Email gabinete:</b>  ${emailGabinete}</div>`;

}

function retornaDespesasDeputado(idDeputado) {
    let request = new XMLHttpRequest();

    request.open(`GET`, `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/despesas`, true); //abre a conexão - false quer dizer que quero uma requisição sincrona
    request.onload = function (e) {
        /*verifica se a operação de conexao foi concluida com exito */
        if (request.readyState === 4) {
            if (request.status === 200) {
                listaDespesasDeputado(request.response.dados, idDeputado);
            } else {
                alert("Erro ao abrir requisição: " + request.statusText);
            }
        }
    };
    request.onerror = function (e) {
        alert("Erro: " + request.statusText);
    };
    request.responseType = "json"; //peço para a api retornar os dados no formato json
    request.send(null);
}

function listaDespesasDeputado(despesas, idDeputado) {
    let detalhesDeputado = document.querySelector(`#deputadoDetails${idDeputado}`);

    let totalDespesas = despesas.reduce((valorAnterior, valorAtual) => {
        return valorAnterior + valorAtual.valorDocumento;
    }, 0);

    detalhesDeputado.innerHTML += `<div class="mt-3"><h4><b>Total Despesas:</b> ${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4></div>`;
}

function listaDetalhesPartido(detalhesPartido, idDeputado) {
    let despesaDeputado = document.querySelector(`#deputadoDespesasDetails${idDeputado}`);

    despesaDeputado.innerHTML += `<div class="row">`;
    despesaDeputado.innerHTML += `  <br><div class"mt-3"><h5 class="d-flex justify-content-center"><b>Informações do Partido:</b></h5></div>`;
    despesaDeputado.innerHTML += `</div>`;
    despesaDeputado.innerHTML += `<div class="row">`;
    despesaDeputado.innerHTML += `  <div class="d-flex justify-content-center"><img class="mt-3" id="image" src="${detalhesPartido.urlLogo}" onerror="this.src='images/sempartido.png'" alt="Imagem não disponível" width="57px" height="auto"></div>`;
    despesaDeputado.innerHTML += `</div>`;
    despesaDeputado.innerHTML += `<div class="row">`;
    despesaDeputado.innerHTML += `  <div><b>Sigla do Partido:</b> ${detalhesPartido.sigla} - ${detalhesPartido.nome}</div>`;
    despesaDeputado.innerHTML += `  <div><b>Situação:</b> ${detalhesPartido.status.situacao}</div>`;
    despesaDeputado.innerHTML += `  <div><b>Total de Membros:</b> ${detalhesPartido.status.totalMembros}</div>`;
    despesaDeputado.innerHTML += `  <div><b>Líder:</b> ${detalhesPartido.status.lider.nome}</div>`;
    despesaDeputado.innerHTML += `  <div><b>Estado:</b> ${detalhesPartido.status.lider.uf}</div>`;
    despesaDeputado.innerHTML += `</div>`;

}