# Simplificação de Dívidas em Grupos

> Documentação técnica do algoritmo de _settle up_ implementado em
> [`src/services/team-payments.service.ts`](../src/services/team-payments.service.ts).

## Definição do Problema

Em um time (grupo de usuários) os membros realizam pagamentos compartilhados ao
longo do tempo: um membro paga por uma despesa (o _pagador_) e a quantia é
dividida entre um conjunto de _devedores_. Cada pagamento individual gera, assim,
uma relação de dívida de cada devedor para com o pagador.

Acumulados muitos pagamentos, a rede de dívidas resultante torna-se densa e
redundante. Considere o exemplo: se _A_ deve R\$ 10 a _B_ e _B_ deve R\$ 10 a
_C_, três pessoas estão envolvidas em duas transações, ainda que o efeito líquido
seja simplesmente que _A_ precisa transferir R\$ 10 a _C_. Liquidar a situação
exatamente como ela foi registrada exige que cada dívida seja paga
individualmente, o que é ineficiente e pouco prático.

O **problema da simplificação de dívidas** consiste em, dado o conjunto de
dívidas registradas, determinar um novo conjunto de transferências monetárias
que:

1. **preserve o saldo líquido** de cada membro — quem deve, no total, continua
   devendo o mesmo valor; quem tem a receber, recebe exatamente o mesmo valor; e
2. **minimize o esforço de liquidação**, isto é, o número de transferências
   necessárias para zerar todos os saldos.

Formalmente, define-se para cada membro $i$ o seu **saldo líquido** $b_i$ como a
diferença entre o total que recebeu (como pagador) e o total que deve (como
devedor):

$$
b_i \;=\; \underbrace{\sum_{\text{pagamentos em que } i \text{ é pagador}} \!\!\!\! \text{valor}}_{\text{recebe}}
\;-\;
\underbrace{\sum_{\text{pagamentos em que } i \text{ é devedor}} \!\!\!\! \text{cota}_i}_{\text{deve}} .
$$

Membros com $b_i < 0$ são **devedores líquidos** (precisam pagar), membros com
$b_i > 0$ são **credores líquidos** (precisam receber) e, por construção,
$\sum_{i} b_i = 0$.

> **Observação sobre a divisão exata.** Quando o valor de um pagamento não é
> divisível igualmente entre os $n$ devedores, o resto é distribuído unidade a
> unidade entre os primeiros devedores (cada um dos primeiros $r$ devedores paga
> uma unidade a mais). Isso garante que a soma das cotas seja exatamente igual ao
> valor pago e, consequentemente, que $\sum_i b_i = 0$ se mantenha.

### Sobre a otimalidade

Encontrar o número _mínimo absoluto_ de transações que liquida um conjunto de
saldos é um problema **NP-difícil** (reduz-se ao problema da partição /
_subset-sum_). Portanto, a abordagem adotada é uma **heurística** que produz uma
solução de boa qualidade com complexidade polinomial, sujeita a uma restrição
adicional de **interpretabilidade** descrita a seguir.

### Restrição de interpretabilidade

Por uma decisão de projeto, um membro só pode transferir dinheiro para outro
membro a quem ele **originalmente devia** (direta ou transitivamente, ao longo da
cadeia de dívidas registradas). Não se criam transferências entre membros que
nunca tiveram qualquer relação de dívida, ainda que isso pudesse reduzir o número
de transações. Essa restrição preserva a _rastreabilidade_ e a _interpretação
humana_ da liquidação: cada transferência sugerida corresponde a um caminho real
de dívidas. Por esse motivo, a rede de dívidas original é mantida como o grafo de
trabalho, em vez de se permitir um emparelhamento arbitrário entre devedores e
credores.

## Modelagem do Problema

O problema é modelado como um problema de **fluxo a custo mínimo** (_minimum-cost
flow_) sobre um grafo dirigido $G = (V, A)$.

### Vértices

$$
V \;=\; \{s,\, t\} \,\cup\, M,
$$

em que $M$ é o conjunto de membros do time, $s$ é uma **fonte** (_source_)
artificial e $t$ é um **sumidouro** (_sink_) artificial.

### Arestas

- **Arestas de dívida** (reais): para cada dívida de $i$ para $j$, uma aresta
  $(i, j)$ com capacidade $u_{ij}$ igual ao valor devido e **custo
  $c_{ij} = 1$**, representando que uma transação monetária é necessária para
  realizar aquele pagamento. Dívidas paralelas na mesma direção são acumuladas em
  uma única aresta.
- **Arestas da fonte**: para cada devedor líquido $i$ (com $b_i < 0$), uma aresta
  $(s, i)$ com capacidade $|b_i|$ e custo $0$.
- **Arestas para o sumidouro**: para cada credor líquido $i$ (com $b_i > 0$), uma
  aresta $(i, t)$ com capacidade $b_i$ e custo $0$.

As arestas artificiais (incidentes a $s$ ou $t$) têm custo nulo por não
corresponderem a transações reais; apenas as arestas de dívida contribuem para o
custo total, que assim mede o número de transações realizadas.

A ideia é **empurrar** um fluxo total

$$
F \;=\; \sum_{i \,:\, b_i > 0} b_i
$$

da fonte $s$ até o sumidouro $t$. Como cada aresta de dívida tem custo unitário,
minimizar o custo total do fluxo equivale a minimizar a quantidade de fluxo que
atravessa arestas de dívida — favorecendo caminhos curtos e, portanto, reduzindo
o número de transferências resultantes.

### Definição formal

$$
\begin{aligned}
\textbf{minimizar} \quad & \sum_{(i,j)\,\in\, A} c_{ij}\, x_{ij} \\[6pt]
\textbf{sujeito a} \quad
& \sum_{j\,:\,(i,j)\in A} x_{ij} \;-\; \sum_{j\,:\,(j,i)\in A} x_{ji}
\;=\;
\begin{cases}
\;\;F, & \text{se } i = s,\\[2pt]
-F, & \text{se } i = t,\\[2pt]
\;\;0, & \text{caso contrário,}
\end{cases}
& \forall\, i \in V, \\[10pt]
& 0 \;\le\; x_{ij} \;\le\; u_{ij}, & \forall\, (i,j) \in A,
\end{aligned}
$$

em que:

- $x_{ij}$ é o fluxo (quantia transferida) na aresta $(i,j)$;
- $c_{ij}$ é o custo unitário da aresta — $c_{ij} = 1$ para arestas de dívida e
  $c_{ij} = 0$ para arestas artificiais;
- $u_{ij}$ é a capacidade da aresta (o valor máximo transferível, isto é, o
  _PIX máximo_ daquela relação de dívida);
- a primeira restrição é a **conservação de fluxo**: o fluxo líquido que sai de
  cada vértice é $+F$ na fonte, $-F$ no sumidouro e $0$ nos demais;
- a segunda restrição limita o fluxo de cada aresta à sua capacidade.

A garantia de viabilidade decorre da construção: atribuindo a cada aresta de
dívida o fluxo igual à sua capacidade total, o balanço de fluxo de cada vértice
resulta exatamente em $b_i$; logo, sempre existe um fluxo viável que satura todas
as arestas da fonte e do sumidouro, isto é, de valor $F$.

## Modelagem da Solução

A solução do problema de fluxo a custo mínimo é obtida pelo algoritmo dos
**caminhos mínimos sucessivos** (_Successive Shortest Path_, SSP).

A ideia central é incremental: enquanto houver fluxo a ser enviado, encontra-se
no **grafo residual** o caminho de **menor custo** da fonte ao sumidouro e
empurra-se por ele a maior quantidade de fluxo possível (o gargalo). Como cada
caminho escolhido é de custo mínimo, o fluxo acumulado é, a cada iteração, de
custo mínimo para o seu valor — propriedade que se mantém até atingir o fluxo
total $F$.

### Grafo residual e arestas reversas

Para cada aresta $(i,j)$ com capacidade $u_{ij}$, fluxo $x_{ij}$ e custo
$c_{ij}$, o grafo residual contém:

- a **capacidade residual direta** $u_{ij} - x_{ij}$, com custo $c_{ij}$; e
- uma **aresta reversa** $(j, i)$ com custo $-c_{ij}$, que permite _cancelar_
  fluxo previamente enviado.

A aresta reversa é essencial: ela possibilita que o algoritmo "desfaça" decisões
anteriores quando um caminho melhor é descoberto, sendo o que garante a
otimalidade do custo. Na implementação, o fluxo é mantido de forma
**antissimétrica** ($x_{ji} = -x_{ij}$), de modo que o fluxo líquido em cada
aresta de dívida pode ser lido diretamente ao final. É também essa estrutura que
permite que dívidas em sentidos opostos entre dois membros (por exemplo, _A_ deve
a _B_ e _B_ deve a _A_) sejam corretamente compensadas em uma única transferência
líquida.

### Busca de caminho mínimo: Dijkstra com potenciais

Como as arestas reversas possuem custo negativo, o algoritmo de Dijkstra não
poderia ser aplicado diretamente. Utiliza-se, então, a técnica de
**potenciais de Johnson**: mantém-se um potencial $\pi_v$ por vértice e
substitui-se o custo real pelo **custo reduzido**

$$
c^{\pi}_{ij} \;=\; c_{ij} + \pi_i - \pi_j \;\ge\; 0,
$$

que é garantidamente não-negativo. Após cada execução de Dijkstra, os potenciais
são atualizados com as distâncias mínimas encontradas
($\pi_v \leftarrow \pi_v + \text{dist}(v)$), preservando a invariância de
não-negatividade na iteração seguinte. Os potenciais iniciam em zero, o que é
válido pois, no grafo inicial, nenhuma aresta de custo negativo possui capacidade
residual positiva.

> A escolha de Dijkstra (em vez de uma busca em largura, que valeria apenas no
> caso de custos uniformes) torna a solução robusta a custos por transação
> **não-uniformes**, permitindo, no futuro, atribuir pesos distintos a diferentes
> relações de pagamento.

## Resolvendo o problema

Concluída a execução do fluxo a custo mínimo, o grafo contém o fluxo ótimo
$x_{ij}$ em cada aresta. A tradução de volta para o domínio do problema é direta:

1. **Ignoram-se** as arestas artificiais (incidentes à fonte $s$ ou ao
   sumidouro $t$), pois não representam transações reais.
2. **Ignoram-se** as arestas reversas (residuais), que carregam fluxo
   não-positivo.
3. Para cada **aresta de dívida real** $(i, j)$ com fluxo líquido positivo
   $x_{ij} > 0$, emite-se uma transferência: _o membro $i$ deve pagar $x_{ij}$ ao
   membro $j$_.

O conjunto dessas transferências constitui a lista de saldos (`balances`)
retornada ao cliente. Por construção, esse conjunto:

- **preserva o saldo líquido** de todos os membros, pois respeita a conservação
  de fluxo (o que entra em cada vértice via fonte sai via arestas de dívida, e
  assim sucessivamente até o sumidouro);
- **respeita a restrição de interpretabilidade**, pois todo fluxo percorre
  apenas arestas de dívidas que de fato existiram; e
- **minimiza o número de transações** (sob a restrição de interpretabilidade e
  como heurística), pois o custo unitário por aresta de dívida penaliza o uso de
  caminhos longos, concentrando o fluxo no menor número possível de
  transferências.

Retomando o exemplo introdutório (_A_ deve R\$ 10 a _B_, _B_ deve R\$ 10 a _C_):
o único caminho disponível na rede de dívidas é $s \to A \to B \to C \to t$;
logo, a liquidação resultante mantém as transferências $A \to B$ e $B \to C$, em
respeito à restrição de interpretabilidade. Já no caso de dívidas em sentidos
opostos (_A_ deve R\$ 5 a _B_ e _B_ deve R\$ 3 a _A_), o cancelamento via arestas
reversas produz uma única transferência líquida de $A \to B$ no valor de R\$ 2.

## Pseudocódigo

A seguir, o núcleo da resolução: o algoritmo dos caminhos mínimos sucessivos com
Dijkstra e potenciais de Johnson.

$$
\begin{aligned}
&\textbf{Algoritmo } \mathrm{SuccessiveShortestPath}(G, s, t, F) \\
&\quad \textbf{para cada } v \in V \textbf{ faça } \pi_v \leftarrow 0 \\
&\quad f \leftarrow 0 \\
&\quad \textbf{enquanto } f < F \textbf{ faça} \\
&\quad\quad (\mathrm{dist}, \mathrm{prev}) \leftarrow \mathrm{Dijkstra}(G, s, \pi) \\
&\quad\quad \textbf{se } \mathrm{dist}[t] = \infty \textbf{ então pare} \quad \text{// sem caminho aumentante} \\
&\quad\quad \textbf{para cada } v \in V \text{ com } \mathrm{dist}[v] < \infty \textbf{ faça} \\
&\quad\quad\quad \pi_v \leftarrow \pi_v + \mathrm{dist}[v] \quad \text{// atualiza potenciais} \\
&\quad\quad \delta \leftarrow F - f \\
&\quad\quad \textbf{para cada } (i,j) \text{ no caminho } s \rightsquigarrow t \textbf{ faça} \\
&\quad\quad\quad \delta \leftarrow \min\!\big(\delta,\; u_{ij} - x_{ij}\big) \quad \text{// gargalo} \\
&\quad\quad \textbf{para cada } (i,j) \text{ no caminho } s \rightsquigarrow t \textbf{ faça} \\
&\quad\quad\quad x_{ij} \leftarrow x_{ij} + \delta \\
&\quad\quad\quad x_{ji} \leftarrow x_{ji} - \delta \quad \text{// fluxo antissimétrico} \\
&\quad\quad f \leftarrow f + \delta \\
&\quad \textbf{retorne } x
\end{aligned}
$$

A sub-rotina de busca de caminho mínimo opera sobre os **custos reduzidos**:

$$
\begin{aligned}
&\textbf{Algoritmo } \mathrm{Dijkstra}(G, s, \pi) \\
&\quad \textbf{para cada } v \in V \textbf{ faça } \mathrm{dist}[v] \leftarrow \infty \\
&\quad \mathrm{dist}[s] \leftarrow 0 \\
&\quad \textbf{enquanto } \exists \text{ vértice não-visitado com } \mathrm{dist} < \infty \textbf{ faça} \\
&\quad\quad u \leftarrow \operatorname*{arg\,min}_{v \text{ não-visitado}} \mathrm{dist}[v] \\
&\quad\quad \text{marca } u \text{ como visitado} \\
&\quad\quad \textbf{para cada } (u, v) \text{ com } u_{uv} - x_{uv} > 0 \textbf{ faça} \\
&\quad\quad\quad c^{\pi}_{uv} \leftarrow c_{uv} + \pi_u - \pi_v \\
&\quad\quad\quad \textbf{se } \mathrm{dist}[u] + c^{\pi}_{uv} < \mathrm{dist}[v] \textbf{ então} \\
&\quad\quad\quad\quad \mathrm{dist}[v] \leftarrow \mathrm{dist}[u] + c^{\pi}_{uv} \\
&\quad\quad\quad\quad \mathrm{prev}[v] \leftarrow u \\
&\quad \textbf{retorne } (\mathrm{dist}, \mathrm{prev})
\end{aligned}
$$

### Complexidade

Seja $n = |V|$ o número de vértices e $m = |A|$ o número de arestas. Cada
iteração do laço principal envia ao menos uma unidade do fluxo total $F$ e
executa um Dijkstra. Na implementação, por se tratar de grafos pequenos (poucos
membros por time), utiliza-se a versão $O(n^2)$ de Dijkstra, resultando em
complexidade $O(F \cdot n^2)$ no pior caso. Para grafos maiores, a substituição
por uma fila de prioridades reduziria cada busca a $O(m \log n)$.
