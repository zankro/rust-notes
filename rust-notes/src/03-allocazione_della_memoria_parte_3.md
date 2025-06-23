# Allocazione della memoria - Malnati 3 <!-- omit in toc -->

# Indice <!-- omit in toc -->
- [1. Ciclo di vita delle variabili](#1-ciclo-di-vita-delle-variabili)
  - [1.1 Esempio costruttore e distruttore](#11-esempio-costruttore-e-distruttore)
- [2. Allocazione della memoria](#2-allocazione-della-memoria)
- [3. Rilascio della memoria](#3-rilascio-della-memoria)
- [4. Puntatori](#4-puntatori)
  - [4.1 Indirizzo valido?](#41-indirizzo-valido)
  - [4.2 Quanto è grosso il blocco puntato?](#42-quanto-è-grosso-il-blocco-puntato)
  - [4.3 Fino a quando è garantito l’accesso?](#43-fino-a-quando-è-garantito-laccesso)
  - [4.4 Se ne può modificare il contenuto?](#44-se-ne-può-modificare-il-contenuto)
  - [4.5 Occorre rilasciarlo?](#45-occorre-rilasciarlo)
  - [4.6 Lo si può rilasciare o altri conoscono lo stesso indirizzo?](#46-lo-si-può-rilasciare-o-altri-conoscono-lo-stesso-indirizzo)
  - [4.7 Viene usato come modo per esprimere l’opzionalità del dato?](#47-viene-usato-come-modo-per-esprimere-lopzionalità-del-dato)
- [5. Rischi](#5-rischi)
  - [5.1 Esempi](#51-esempi)
    - [5.1.1 Dangling Pointer](#511-dangling-pointer)
    - [5.1.2 Memory Leakage](#512-memory-leakage)
    - [5.1.3 Double free](#513-double-free)
- [6. Gestire i puntatori](#6-gestire-i-puntatori)


# 1. Ciclo di vita delle variabili

![image.png](images/allocazione_della_memoria_3/image.png)

Abbiamo cominciato a vedere la divisione tra stack e heap e abbiamo visto sostanzialmente come le variabili locali esistono nel contesto del blocco in cui sono definite.

Quando entro all'interno di un blocco e incontro la definizione di una variabile globale, questa comincia a esistere, viene allocata sullo stack, quando arrivo alla parentesi graffa corrispondente alla chiusura del blocco la variabile viene buttata via, perdendo il dato che aveva al suo interno.

In generale, adesso vogliamo focalizzarci sul controllo del ciclo di vita che ciascuna di variabili ha e di come noi andiamo a intervenire.

Allora, le variabili globali esistono da sempre, **quindi prima che parta il main e cessano di esistere dopo che il main è finito**.
Sono accessibili in ogni momento e in generale se contengono del codice di inizializzazione, questo viene eseguito prima che il main parta.
Se contengono del codice di finalizzazione, questo viene eseguito dopo l'uscita del main.

L'altra caratteristica delle variabili globali è che hanno un **indirizzo assoluto**, il compilatore sa già dove le mette e quindi può, tutte le volte che incontra una variabile globale, scrivere già *“quella lì sta all'indirizzo 3b7f5942”*.

Le variabili locali, viceversa, incominciano a esistere quando si arriva alla loro definizione, cioè alla riga dove compare quella variabile locale lì, int i=5, in quel momento comincia a esistere, cessano di esistere quando arrivo alla chiusura graffa corrispondente e hanno un indirizzo che è **relativo alla cima dello stack**.

Quindi quando il compilatore genera il codice, per riferirsi a quella variabile locale lì, tendenzialmente dice `base_ptr+27`, `base_ptr+32`, qualcosa del genere, dove `base_ptr` è un registro ausiliario, nel caso dell'x86, che serve a contenere una copia dell’indirizzo dello stack all'inizio della funzione stessa, in modo da poter definire questo “offset” relativo da cui partire.

![image.png](images/allocazione_della_memoria_3/image%201.png)

Le variabili locali hanno un valore iniziale casuale.
Se io dichiaro solo `int i` e non gli assegno direttamente un valore di inizializzazione, lo stack si abbassa di 4 byte e cosa c'è in quello spazio nello stack? Quello che c’è.

Non sono in grado di prevedere il suo contenuto.

![image.png](images/allocazione_della_memoria_3/image%202.png)

Poi abbiamo le variabili dinamiche, cioè sono quelle che contengono un dato e che noi possiamo referenziare solo tramite puntatori.
Tocca al programmatore controllare nel ciclo di vita.

Una variabile dinamica comincia a esistere nel momento in cui io esplicitamente la alloco, e cessa di esistere quando la rilascio.

Come si fanno allocazione e rilascio?
Dipende dal linguaggio.

Se sto scrivendo del codice in C, l'allocazione si fa con `malloc`, o le sue funzioni parenti `calloc`, `realloc`, e il rilascio si fa con `free`.

Se sto lavorando in C++, che mi dà un supporto più avanzato alla gestione dei tipi, l'allocazione dinamica si fa con l'operatore `new` e il rilascio si fa con l'operatore `delete`.
Se ho una classe di tipo `automobile`, che rappresenta un veicolo, posso dire, la mia variabile `auto* a = new auto;`.

L'effetto di scrivere new auto è duplice.
Viene cercato sullo heap un blocco di memoria grande quanto serve a contenere un'automobile. Quanto ne serve dipende da come è definita quella classe, da quanti campi internamente avrà.

Subito dopo, trovato questo blocco, viene invocato il **costruttore della classe**, che si occupa di riempire quel blocco con i dati iniziali.

Esattamente come in Java, in C++ le classi hanno dei costruttori che ci permettono di garantire che la memoria sia inizializzata correttamente.

*Come rilasciamo i blocchi di memoria che allochiamo dinamicamente?*
Li rilascio con `delete`. 

*Cosa succede quando chiamo delete?* 
Anche qui due cose.

Prima di tutto **viene chiamato il *distruttore***. 
*Cos'è il distruttore?*
È un particolare metodo che il C++ ci mette a disposizione, all'interno del quale noi possiamo scrivere cosa fare nel momento in cui la variabile cessa di esistere.
Il distruttore ci è utile quando una classe contiene, all'interno dei propri campi, delle risorse che devono essere lasciate.

Ad esempio, io potrei avere una classe che gestisce un file, il costruttore potrebbe essere responsabile di aprire il file, il distruttore è responsabile di chiudere il file.

Così sono tranquillo che quando quell'oggetto cessa di esistere, il file sarà chiuso.

Il costruttore lo chiamate ***voi*** esplicitamente nel momento in cui fate `new` o semplicemente dichiarate una variabile di quel tipo, il distruttore viene chiamato esclusivamente dal ***compilatore***.

Viene chiamato, in qualche modo, sotto il vostro diretto controllo quando fate `delete`, per cui lui distrugge e poi rilascia la memoria, cioè notifica che quel gruppo di byte può essere riusato per altro. 
Nel caso delle variabili locali viene chiamato nel momento in cui la variabile viene egettata.

## 1.1 Esempio costruttore e distruttore

Facciamo una prova velocissima per renderci conto di questa cosa qua.

![image.png](images/allocazione_della_memoria_3/image%203.png)

Vediamo che il programma parte, mi stampa “main()”.
Subito dopo aver chiamato main, e subito dopo aver fatto la stampa, dichiara la variabile `t` di tipo `Test`, che quindi viene automaticamente costruita, e qui mi dice *“l’ho costruito all’indirizzo 16db8353b”*, poi va avanti, stampa “fine main()”, e poi esegue return 0, chiusa graffa.

In corrispondenza di quella chiusa graffa lì, lui dice “*devo pulire lo stack*”*.* 
Cosa c’era nello stack?
Avevo un oggetto `Test`, quindi automaticamente invoca il distruttore, e vediamo “distrutto Test”, proprio a quell’indirizzo lì.

![image.png](images/allocazione_della_memoria_3/image%204.png)

*Cosa succede se facciamo così?*

Parte dal main, inizia il ciclo for, all’interno del ciclo for dichiaro la variabile `t`, che viene costruita, viene costruita dove?

Abbassando leggermente lo stack, e quindi sta all’indirizzo 37, quello che finisce con 37.
Poi subito dopo stampa iterazione numero 0, e arriva la chiusa graffa, dove test finisce, e quindi che cosa fa? Distrugge l’oggetto `t`.

E chiaramente l’ha costruito all’indirizzo 37, e lo distrugge all’indirizzo 37, quindi lo stack risale un po’, poi torna a fare l’iterazione successiva.

Dice “*ah, ho bisogno di un Test*”, riabbassa lo stack, stampa iterazione numero 1, rialza lo stack, e lo fa tre volte.

Poi arriva al fondo, stampa “fine del main”, chiusa.

Quindi, vediamo che, dichiarata dentro un ciclo for, la variabile viene creata tante volte quante sono le iterazioni del ciclo, e viene distrutta al termine dell’iterazione del ciclo.

![image.png](images/allocazione_della_memoria_3/image%205.png)

Se io dichiarassi anche una variabile globale, `Test t1`, vedete che questa volta dice *“ho costruito un Test all’indirizzo 1000a8000”*, prima ancora di chiamare main.

Perché? Perché il costruttore delle variabili globali parte prima che inizi il main!

Fa tutte le sue cose, mi dirà “fine main”, e poi mi distrugge quella parte lì.

Qui non riusciamo bene a distinguere che cosa avviene dove e quando, perché anche prima ci stampava “distrutto” dopo aver scritto “fine del main”, perché noi la scritta “fine del main” non la possiamo mettere in corrispondenza del chiusa graffa, possiamo solo metterla in corrispondenza subito prima del chiusa graffa, quindi la vera distruzione avviene tra la stampa e il chiusa graffa, se fosse locale.

Quella globale avviene dopo il chiusa graffa.

Comunque, sostanzialmente le cose sono fatte così.

Tutte queste sono variabili che hanno un ciclo di vita ben definito.

![image.png](images/allocazione_della_memoria_3/image%206.png)

*Cosa succede se noi invece allocassimo delle cose dinamicamente?*

Scritto in questo modo, `new Test()` dice *“questa variabile non deve stare nello stack, deve stare nello heap e la voglio tenere fin quando mi viene comoda”*.

Ad esempio, dentro il ciclo for potrei dire `if i==1 delete pt`.
Quindi invece di far coincidere la vita di questa variabile con un blocco, la creo prima del for e la distruggo a metà delle iterazioni del for.

Quindi avrò delle iterazioni del for in cui quella variabile lì non è più valida.

Parte, è sempre costruita la variabile globale t1 che questa volta parte all’indirizzo 1049d8000, poi viene stampato “main()”, e poi viene stampato `Costruito Test @ 0x600000744040`, e notiamo che l’indirizzo è totalmente diverso: 60000744040.

Questo perché vive in una zona totalmente distinta, nell’heap!

Poi c’è l’iterazione numero 0, poi dovrebbe arrivare nell’iterazione numero 1 e in effetti ci entra ma subito prima della stampa viene eseguita la delete.

Poi fa l’iterazione numero 2, il ciclo for finisce, finisce il main, ma c’è ancora una variabile globale, che quindi viene buttata via invocando il distruttore.

Quindi le variabili possono avere un codice di inizializzazione, lo chiamiamo **costruttore**, possono avere un codice di rilascio, che chiamiamo **distruttore**.

Il costruttore implicitamente lo andiamo a chiamare nel momento in cui mettiamo in gioco la variabile, il distruttore è sempre solo chiamato dal compilatore: noi non abbiamo nessuna chiamata `~Test()`.

E viene chiamato nel momento giusto, quando quella variabile cessa di esistere.

![image.png](images/allocazione_della_memoria_3/image%207.png)

Quindi le variabili dinamiche hanno un indirizzo che è assoluto.
Peccato che non si può sapere a compile time, solo a run time me lo verrà detto, quando io invoco `new *qualcosa*`, in quel momento verrà cercato un posto grande a sufficienza per far stare la mia variabile.

E accedo alle variabili dinamiche solo tramite puntatori, mentre alle altre accedo con variabili che hanno un nome.

Il fatto che sia inizializzato o meno il valore iniziale dipende da cosa ho scritto nel costruttore, dipende anche dal linguaggio. 
Se faccio `malloc`, malloc non mi dà garanzie di inizializzazione, mi prende un blocco grande quanto gli chiedo, ad esempio 84, e lui mi cerca 84 byte, ma non è che li pulisce, mi dà il puntatore al primo di 84 byte e basta, dentro ci può essere qualunque cosa.

Quando faccio in C++ `new`, new passa attraverso il costruttore che di solito si prende la briga di inizializzare le cose.

Chiaramente perché possano funzionare le variabili dinamiche ci vuole un sistema di supporto, quando io chiamo `malloc` o `new`, come fa l’implementazione di `malloc` o `new` a darmi un indirizzo?

Deve cercare!
Vuol dire che internamente `malloc` e `new` sono in realtà delle funzioni sofisticate che si appoggiano a una loro rappresentazione della memoria, sanno che per esempio all’inizio lo heap va dall’indirizzo 60000 all’indirizzo 70000, prendiamo dei numeri a caso, ed è tutto libero, quindi alla domanda *“dammene un pezzo”* magari vi danno l’inizio, poi dopo un po’ chiedo un altro pezzo, mi danno quello che viene subito dopo, poi magari gli rilascio il pezzo iniziale e a questo punto l’heap che prima era tutto bello compatto è diventato con un buchino.

Quando gli chiederò un’altra cosa, probabilmente cercheranno se tra i rotti c’è un pezzo piccolo dove ci sta già quello che io gli chiedo, perché?

Perché vale il principio che se posso uso gli sfridi, non vado a intaccare il pezzo grosso.

Chiaramente andare a cercare qual è il punto più conveniente può essere lento, perché io ho tante alternative, potrei accontentarmi della prima ma non è detto che la prima sia la più furba.

Probabilmente `malloc` e `new` possono tenersi i loro pezzettini organizzati in tanti modi, il modo più becero è una lista, però se è una lista per sapere quale pezzettino più adatto la devo visitare tutta, e quella lista può essere molto lunga, ci mette un mucchio a saperlo, oppure posso tenerla organizzata ad albero, è molto più articolata, tengo un albero dove parto da un punto medio, a destra metto i pezzi piccoli, a sinistra metto i pezzi grandi e così via, quella potrebbe essere un’altra strategia.

L’unico problema è che quando io seguo un pezzo devo ribilanciarmi l’albero, perché adesso mi sono trovato un pezzettino, uno sfridino piccolo che deve andare da qualche parte e devo andare a spostare, oppure quando qualcuno mi restituisce se riesco a compattare devo fare un pezzo grosso.

Quindi le operazioni di allocazione e rilascio sono potenzialmente operazioni lente e complesse, che richiedono di tenere allineate un mucchio di cose, consumano.

Se `malloc` deve farsi l’albero vuol dire che una parte della memoria che globalmente ha a disposizione la usa per se stesso e non la potrà mai dare al programma — più è sofisticata quella struttura lì fatta di puntatori, mappe, tabelle e schifezze di ogni tipo, meno sarà la memoria per il programma. 
Probabilmente sarà più efficiente nel comportamento, ma c’è un bilanciamento da trovare.

*Cosa succede quando il programmatore chiama* `free` *piuttosto che* `delete`*?*
Restituisce quel pezzettino che aveva ricevuto.

Che cosa se ne fa la funzione `free` o la funzione `delete`?
Va a vedere nell’albero, nella lista, in generale nella struttura dati se questo pezzettino A è suo o meno, perché io potrei fare il furbo — ad esempio se `malloc` mi dava gli indirizzi da 60.000 a 70.000 e io gli dò un indirizzo che è 1.000, ma lui mi dirà che non è mio.

Supponendo che sia suo va a cercare se quel pezzettino lì gli risultava come occupato e lo deve marcare come libero e possibilmente lo deve accorpare ad altri pezzi liberi e adiacenti, in modo da fare un pezzo più grosso.

Cosa succede se gli restituisco un pezzo, e poi senza averglielo chiesto, glielo restituisco di nuovo?
Cioè se io nel programma che ho scritto, là dove ho messo `delete`, mettessi `delete` due volte?
La prima volta tutto bene, prende quel pezzo e lo mette a suo posto.

La seconda volta dipende come è implementata.
Un’implementazione di `delete` molto lenta ma attenta potrebbe rigettarmelo dicendo *“che è sta roba? No, non va bene”*.
Un’implementazione un po’ più veloce, che magari è più desiderabile perché io ho bisogno di fare tante `new` e tante `delete` nell’arco della vita del mio programma, potrebbe prendere per buono che quell’indirizzo che gli passo sia effettivamente indirizzo in uso e aggiornare le sue strutture dati.

Peccato che le strutture erano già aggiornate, e quindi si spacca tutto.
E a quel punto lì alle prossime richieste a `new` non ci capisce niente.

Se io non rilascio, resta il buco.
Se io rilascio due volte, spacco.

Se poi rilasci una cosa sbagliata, supponiamo, gli ho chiesto un indirizzo e lui mi ha dato 6.300, io gli restituisco 6.500, che è solo un pezzo. Potrebbe non accorgersene, ma a quel punto fa casino totale. Qui la grande responsabilità del programmatore è di fare le operazioni giuste.

# 2. Allocazione della memoria

![image.png](images/allocazione_della_memoria_3/image%208.png)

In C abbiamo **`malloc`** che ci restituisce un void asterisco, cioè un puntatore opaco, un puntatore ad una cosa qualunque. Prende come parametro un numero di byte e ci restituisce, se può, un puntatore valido.

**`Calloc`** che prende in ingresso un numero di byte e un moltiplicatore. 
Serve per fare gli array. Ad esempio, ho bisogno di un array di 25 automobili. Fornisco quanti elementi voglio, e quanto è grande un elemento di tipo auto, ad esempio 16 byte.
Quindi devo dare 25 x 16, 400 byte.

**`Rialloc`** è particolare, dice “*cara malloc, tu mi avevi dato questo puntatore, guarda, adesso me serve uno un po’ più grande”*, oppure *“mi serve un po’ più piccolo”*.

Un po’ più grande, non è detto sempre, un po’ più piccolo è facile. Vuol dire che lei si segna che c’è un pezzo in fondo che è diventato libero.

Un po’ più grande è più complicato, perché non è detto che al fondo ci sia ancora spazio. Quindi Rialloc non sempre funziona: se fallisce restituisce null.
Dice *“guarda, quello che avevi è ancora buono, però non posso dartene di più, non ce l’ho o non ce l’ho lì, devo spostarlo”*.

![image.png](images/allocazione_della_memoria_3/image%209.png)

In C++ invece abbiamo un `new` che prende il nome del tipo ed eventualmente tra parentesi gli argomenti.

Le parentesi nella versione vecchia del C++ erano sempre tonde, nella versione moderna del C++ sono graffe, perché questo semplifica, toglie delle ambiguità possibili.

Nel C++ potete fare `new` del tipo e basta, oppure `new[]`.
New con le quadre serve per gli array, più o meno ha la stessa differenza che c’è tra malloc e calloc in C.

![image.png](images/allocazione_della_memoria_3/image%2010.png)

Se allocate un array, specifichiamo quanti elementi vogliamo e lui inizializza tanti pezzi uno di fianco all’altro.

# 3. Rilascio della memoria

![image.png](images/allocazione_della_memoria_3/image%2011.png)

Se avete ottenuto il puntatore con una certa funzione, dovete rilasciarlo con la funzione ***duale***.

Le cose create con `malloc`, `calloc`, `realloc` si rilasciano con `free`.

Le cose allocate con `new` si rilasciano con `delete`.
Le cose allocate con `new[n]` vengono rilasciate con `delete[]`.

È necessario fare così, perché altrimenti il compilatore non capisce.

Se il blocco non viene rilasciato si crea una perdita di memoria, se invece viene rilasciato due volte si spacca tutto: si corrompono le strutture dati che internamente vengono usate e poi di lì in avanti è assolutamente impossibile dire cosa capita.

# 4. Puntatori

![image.png](images/allocazione_della_memoria_3/image%2012.png)

L’idea del puntatore non è solo collegato alla memoria dinamica.

Certo, non c’è altro modo in C e C++ di avere accesso a memoria dinamica se non tramite puntatori, perché il linguaggio vi pone questo.

In realtà i puntatori sono presenti in tantissimi altri linguaggi (li abbiamo anche in javascript, in java, in python e così via..), ma semplicemente non lo sapete, perché la cosa viene tenuta in qualche modo nascosta. 
Quei puntatori lì sono essenziali per l’ottimizzazione degli algoritmi.

Perché? Perché se io devo passarti un dato, se quel dato è piccolo va bene, me lo passi — un intero ad esempio non è un grosso problema.
Ma se io devo passarti, ad esempio, un array che contiene mille elementi, mica te lo posso copiare.

Sì, in alcuni casi te lo copierò se ho davvero bisogno di mantenere due informazioni disgiunte. Ma altrimenti è onerosissimo.
L’idea di poterti passare il puntatore mi dà un mucchio di efficienza, è comodo.

Quindi, il fatto che io abbia lo spazio dinamico (quindi che posso chiedere quando mi serve e rilasciare quando mi serve, che è già un grande vantaggio perché posso chiedere delle cose grandi a piacere senza saperlo a priori, posso tenerle a lungo per quanto mi serve etc…) abilita un mucchio di cose che altrimenti non riuscirei a fare.

Una linked list, ad esempio, se non avete la memoria dinamica, non la potete fare.
Perché la linked list, ogni volta che aggiungete un elemento, ha bisogno di prenderne un pezzo in più e di metterlo al fondo.

Però vi pone il problema di gestire correttamente il rilascio.

I puntatori, al di là dell’uso della memoria dinamica, servono comunque tantissimo e abilitano tanti meccanismi che adesso vediamo nel dettaglio.

Però, se li usiamo male è un disastro, perché portano gli ***undefined behaviours*** che hanno conseguenze disastrose.

![image.png](images/allocazione_della_memoria_3/image%2013.png)

Vediamo l’uso tipico dei puntatori.

Il pezzo più semplice dell’uso dei puntatori, che non necessitano direttamente la memoria dinamica, è banalmente quando io devo dare l’accesso a una variabile senza dover copiare la variabile.

Io ho la variabile `A`, che vale 10, e voglio permettere a qualcun altro di andarci a guardare dentro. 
Recupero dalla variabile il suo puntatore e passo il puntatore a chi gli interessa.
Quest’altro, dereferenziando il puntatore, potrà leggere cosa c’è scritto in quella variabile, potrà scrivere cosa c’è scritto in quella variabile.

Questo è un uso comunissimo.

Oppure posso avere dei puntatori che sono allocati per uno scopo particolare.
Lì ho `int* pB = new int{24}`, voglio un intero dinamico che inizialmente vale 24 e che potrò cancellare in un qualche momento.
Magari lo darò a qualcun altro per cancellarlo al posto mio o cose del genere.

I puntatori possono essere resi esplicitamente **invalidi**.
La convenzione che viene assunta in C è che un puntatore è invalido se contiene il numero 0.
Il puntatore dentro di sé non è nient’altro che un numero, è l’offset nello spazio virtuale di indirizzamento. Se io gli scrivo 0, per convenzione quello è un puntatore invalido.
Nel linguaggio C si usa di solito la macro NULL, che è definita come `((void*)0)`.
Nel C++ si usa la parola chiave `nullptr`.

*Perché questo è utile?*
Perché in certe situazioni avere dei puntatori nulli mi permette di capire che certe cose non continuano oltre quel puntatore nullo.

Pensate a una lista collegata: ho il puntatore al primo elemento, che contiene il puntatore al secondo elemento, che contiene il puntatore al terzo elemento, che finalmente contiene null — vuol dire che finisce lì la lista.

Quindi avere una convenzione che mi dice quando un puntatore smette di essere buono è utile.
Altrimenti non implementereste tantissime cose.

![image.png](images/allocazione_della_memoria_3/image%2014.png)

Il problema è che ci sono tante responsabilità.

## 4.1 Indirizzo valido?

Quando io ricevo una variabile di tipo puntatore e ci guardo dentro, leggo un numero, ad esempio `3b7f5944`… *posso dire se quel numero è **valido**?*

Se ci leggo 0 posso sicuramente dire che **non è valido.**

Ma se c’è scritto `3b7f5944` potrebbe *essere stato valido*, ma magari io l’ho appena rilasciato, e se dopo averlo rilasciato ci vado a scrivere ancora, potrei fare dei danni (perchè magari ora quel blocco apparterrebbe a qualcun altro).

Nell’esempio di codice che abbiamo visto prima, nel ciclo for alla seconda iterazione buttavamo via la variabile dinamica `pt`, ma nella variabile `pt` mi era rimasto l’indirizzo a quel blocco di memoria che abbiamo rilasciato nel for.
E se dopo che ho fatto `delete` ci andassi a scrivere sopra, farei del danno.

Per cui se io vedo un numero diverso da 0 **non posso sapere direttamente se quello lì è mai stato buono, è buono o è ancora buono**.

Questo è il primo grossissimo problema che abbiamo con i puntatori.

## 4.2 Quanto è grosso il blocco puntato?

Secondo problema, quanto è grosso il blocco puntato?
Un puntatore è un singolo numero che rappresenta **un solo byte**.
Da cosa capisco *quanti byte posso andare a vedere, a partire da quello puntato?*
Potremmo pensare dal tipo: se quello lì è un puntatore a `int`, supponendo che l’int sia di 4 byte, so che posso andare a guardare da quella cella lì fino alle tre successive, se fosse buono.

Ma se io avessi alloccato un `int[]` array? Non posso sapere quanti `int` ci sono in quell’array, quindi non so fino a dove posso leggere lecitamente…
E l’idea di andare a contare finché non trovo lo 0 è un’idea peregrinissima, perché potrebbe non esserci lo 0 e magari finisco a leggere in zone che non sono mie…

Dunque, il tipo non mi dà queste informazioni.
Dire che quello lì è un `char*` mi dice sì che se vado alla fine di questo puntatore troverò un char, ma quanti char non lo so.


>💡 **From ChatGPT**
>
>![image.png](images/allocazione_della_memoria_3/image%2015.png)

## 4.3 Fino a quando è garantito l’accesso?

*Fino a quando è garantito l’accesso?* 
Non lo sappiamo.

Se quello lì è un puntatore ad una variabile locale, è garantito fino a che il codice che l’ha allocata non ha raggiunto la graffa finale.
Ma se io ho copiato questo puntatore in una struttura, quando andrò a dare la struttura in giro, non posso sapere se quella variabile lì era già finita di vivere o meno.
**Ho perduto questa informazione.**

## 4.4 Se ne può modificare il contenuto?

Posso modificare il contenuto? 
Non lo sappiamo.

Teoricamente il tipo di puntatore potrebbe aiutarmi.

C e C++ distinguono il `const T*` dagli `T*` — `char*` mi dice *“quello è un puntatore a caratteri che puoi modificare”*, `const char*` mi dice *“quello è un puntatore a caratteri che non puoi modificare, che devi solo leggere”*.

Ma è un po’ debole come cosa, perché io posso castare e far diventare un `const char*` un `char*` semplice. E a quel punto non ne so più niente se quella era una cosa che non dovevo toccare...

## 4.5 Occorre rilasciarlo?

*Sono responsabile del suo rilascio?* 
Non lo sappiamo.

Dipende come è nato quel puntatore.

Se io mi sono procurato quel puntatore dalla variabile `l` tramite l’operatore `&`, non sono responsabile, perché la variabile `l` ha il suo ciclo di vita predefinito, e quando arriverà al fondo del suo blocco verrà buttata via.

Ma se io invece mi sono procurato il puntatore con `new`, sono responsabile io del suo rilascio.

Peccato che non c’è modo di capirlo.
Sì è vero, abbiamo visto nell’esempio di prima che l’indirizzo di una zona nell’heap è diverso dall’indirizzo di una zona nello stack, ma non posso guardare quella cosa lì, perché ogni volta che lancio il programma lo spazio di indirizzamento è randomizzato e posso avere delle cose a caso.

Quindi non posso basarmi su questa informazione qua.

E i linguaggi C e C++ non mi danno nessun suggerimento per distinguere quello che è un puntatore dello heap, di cui qualcuno si deve occupare di rilasciare, da quello che è un puntatore allo stack, dove è il linguaggio che garantisce il rilascio.

## 4.6 Lo si può rilasciare o altri conoscono lo stesso indirizzo?

Supponendo che io possa per qualche via traversa sapere che sono responsabile del rilascio, lo posso rilasciare in questo momento? O c’è una copia di questo stesso puntatore in giro in casa di qualcuno che potrebbe andarci a guardare dentro? 
Non lo sappiamo.

## 4.7 Viene usato come modo per esprimere l’opzionalità del dato?

È difficile capire se questo puntatore viene usato per fornire un accesso efficiente ai dati oppure per esprimere il concetto di *opzionalità*. 
Per esempio, una funzione che cerca un valore in un array potrebbe restituire un puntatore al valore se lo trova, oppure null se non lo trova.
Non abbiamo modo di saperlo.

Quello lì è un puntatore, non ha al suo interno altro tipo di informazioni per specificare cose di questo tipo.

Quindi il linguaggio, pur dandomi degli strumenti potenzialmente potenti per poter ottimizzare l’accesso, mi lascia però con sette domande a cui non ho risposta.

E se da programmatore devo mettere le mani al codice, quella risposta lì la devo dare io.

*E come facciamo a darla?*
Andando a leggere tutto il codice, non solo un pezzettino, ma tutto.
Perché se di quel puntatore ce n’è una copia sperduta da qualche parte, io non posso farci tante cose.

Il problema è che *“tutto quel codice”* comprende tutto il codice che scrivo io, tutto il codice che sta nelle librerie, e tutto il codice nascosto da qualche parte che in qualche modo interagisce con il mio.
E se non lo capisco, faccio delle assunzioni che possono essere sbagliate.

E ciò può causare problemi tutte le volte che provo poi a rieseguire il mio programma.
Il problema è che buona parte di questi malfunzionamenti non sono ripetibili, ma nascono da combinazioni astrali, dal fatto che sono successe certe cose, che alcune sono successe più in fretta di altre, e cose simili… **tutte cose che sono fuori dal nostro controllo.**

E quindi diventa complicatissimo sviluppare i programmi.

Per questi motivi, i programmi scritti in C e C++ sono un *florilegio* di bug.

![image.png](images/allocazione_della_memoria_3/image%2016.png)

In C e C++ usiamo i puntatori in tanti modi.

Il più semplice è quello per accedere, qua e ora, ad un dato valore.
Mi serve sostanzialmente per ottimizzare: evito di spostare una grossa struttura dati, e piuttosto ti passo il puntatore alla struttura.

Ti dico “*Cara funzione, io te lo passo e tu lo usi adesso, per il tempo della tua chiamata. Ci guardi dentro, ci scrivi se devi scrivere, **ma non te lo copi.** Perché quando tu sarai tornata io non posso più garantirti che questo dato rimanga valido, quindi lo devi usare solo adesso*”.

Il problema è che non riesco a trasmettere in codice questa informazione.

Il meglio che posso fare è scriverla in un commento, ma il commento lascia il tempo che trova, perché bisogna che qualcuno lo legga.
Bisogna prima che qualcuno l’abbia scritto, e poi bisogna che qualcuno lo legga e ne faccia uso.

Un puntatore lo posso usare per indicare a una funzione dove dovrà mettermi le sue risposte.

È il caso, ad esempio, della funzione `scanf`.
Quando in C usiamo `scanf` per leggere la tastiera, cosa facciamo?
Scriviamo `scanf(”%d”, &i)`, cioè passiamo il puntatore a una nostra variabile, dentro cui `scanf`, se trova un intero, ci scriverà il valore che ha letto.

![image.png](images/allocazione_della_memoria_3/image%2017.png)

Qua c’è un esempio, ho una funzione ipotetica `read_data1`, che usa il valore di ritorno per dirmi se è riuscita o meno a leggere i dati, e quindi mi dà come valore di ritorno un booleano.

Nel caso in cui il booleano sia true, vuol dire *“ho letto i dati”*, e il dato che legge me lo mette dentro il parametro.

Ovviamente siccome il parametro è passato per copia, io non posso passargli un int, perché quell’int lì, quando la funzione ritorna ve l’avrebbe buttato via.
Io gli devo passare un puntatore, in modo tale che la funzione lo dereferenzia, ci scrive dentro e anche se poi il puntatore viene buttato via, siccome io ho l’originale, dall’originale prendo quello che mi serve.

E quindi, se qualcuno mi ha passato un risultato buono e ho dei dati disponibili, vado a prendermi i dati, li metto dentro il puntatore, `*result = get_some_data()` , quello che devo metterci. E in questo caso ritorno true.

Se non mi hai passato un puntatore buono, oppure non ho niente da dirti, ti rispondo false e lascio perdere.

![image.png](images/allocazione_della_memoria_3/image%2018.png)

Posso usare un puntatore per accedere a un blocco di dati.

Questo è uno dei grossi casini del C, perché automaticamente quando voi dichiarate un array di n elementi, la vostra dichiarazione `int[10]`, quell’array lì si dimentica di essere un array *lungo 10 elementi*: viene ***demoted***, ridotto a puntatore al primo elemento. Fine.

Ma quando io lo passo a qualcun altro, quell’altro che ne sa che lì ce ne sono davvero 10?Potrebbero essere solo 5.

Per questo in C++ c’è un tipo apposito, l’**`std::array`**, che ha nella firma del tipo la dimensione e questo permette di capire quanto è grande.

![image.png](images/allocazione_della_memoria_3/image%2019.png)

Posso usare il puntatore per farti accedere a una sequenza di dati più o meno grande, non nota priori, è il caso delle stringhe del C.

Le stringhe del C io ti passo il puntatore all’inizio e chi ha bisogno da quel puntatore va avanti a cercare quello che gli serve, fino a quando non incontra lo `/0`.

Tecnica pericolosissima, perché è una di quelle più facilmente hackerabile.

![image.png](images/allocazione_della_memoria_3/image%2020.png)

Posso usare i puntatori per accedere a dati dinamici, ed è tutto quello che facciamo normalmente quando ci serve allocare delle mappe, delle liste, delle cose la cui dimensione non è nota a priori.

Il problema è che in questa situazione c’è sicuramente la responsabilità del rilascio: in C++ se ho ottenuto il dato con una `new`, qualcuno lo dovrà rilasciare con la `delete`, oppure se in C l’ho ottenuto con la `malloc`, qualcuno lo dovrà rilasciare con la `free`.

Di nuovo il C++ mi facilita perché mi mette a disposizione delle classi già fatte che si occupano nel loro costruttore di prendere i pezzi di cui hanno bisogno e nel loro distruttore di buttare via tutto quello che avevano preso.

Rendendo quindi la vita del programmatore un pochino più sicura, ma solo un po’.

E poi posso usare il puntatore come modo per esprimere l’opzionalità di un risultato, ovvero ti ritorno null se non ho trovato niente, o ti ritorno un puntatore valido se ho trovato qualcosa.
**Ma non è chiaro se quel puntatore valido va rilasciato o meno.**

![image.png](images/allocazione_della_memoria_3/image%2021.png)

Oppure posso usare il puntatore per fare delle strutture articolate come le liste, le mappe, etc...

![image.png](images/allocazione_della_memoria_3/image%2022.png)

Quindi, lavorando in C non c’è salvezza. 
Tutte quelle sette domande elencate prima non hanno nessuna risposta.
È il programmatore che deve trovarsela.

C++ mi aiuta un po’ di più.
Mi aiuta un po’ di più perché mi dà un supporto sintattico attraverso dei tipi più elaborati, mediante i quali *alcune cose* mi vengono gestite.

Ad esempio, per i puntatori dinamici mi dice “*guarda, io ti do una cosa che si chiama **Smart Pointer**, che è fatta in modo tale per cui tu la crei e automaticamente quando questa cessa di essere visibile distrugge il dato a cui punta*”.

Anzi te ne do due.
Uno che si chiama ***Unique Pointer***, che non può essere copiato.
Un altro che si chiama ***Shared Pointer***, che può essere copiato.

Quello che può essere copiato conta quante copie ci sono e quando l’ultima copia muore, rilascia il dato, così non c’è rischio di perdere l’informazione.

Lo Unique Pointer invece è molto più agile, ma non può essere copiato.
Se cerchi di copiarlo ti dice *“no, al massimo lo **cedi**”*: il C++ introduce un concetto che si chiama ***movimento***.

*Cosa vuol dire “Lo cedi”?* 
Beh: lo dai a lui, però poi non è più tuo.

![image.png](images/allocazione_della_memoria_3/image%2023.png)

Il programmatore ha tutta una serie di responsabilità.

- Deve limitare gli accessi a un blocco **nello spazio**, cioè non devo andare oltre la zona a cui quel puntatore lecitamente può arrivare, e neanche prima, e **nel tempo**, cioè devo accederci solo quando quel dato lì effettivamente esiste.
- Non devo assegnare ai puntatori valori che corrispondono agli accessi non mappati.
Se io dichiaro una variabile locale di tipo `int*` e non la inizializzo, non è che dentro non c’è scritto niente, c’è scritto una schifezza qualunque che era presente sullo stack quando lo stack è stato abbassato. Magari c’è scritto `0`, se sono fortunato. Magari c’è scritto `3b7f5962`. Ma non è un vero indirizzo, è semplicemente che sono dei byte a caso che c’erano scritti lì, e se io provo e vado ad accedere, chissà che succede.
- Devo rilasciare tutta la memoria dinamica allocata una e una sola volta, usando la funzione duale di quella che è servita per l’allocazione. Perché se io ho allocato con `new` non posso rilasciare con `free`. Perché `free` ha delle strutture dati diverse da quelle di `new`.

# 5. Rischi

![image.png](images/allocazione_della_memoria_3/image%2024.png)

*Cosa succede se faccio casino?*

- Allora, se accedo a un indirizzo, quando il corrispondente ciclo di vita del valore a cui quell’indirizzo punta è terminato, andiamo incontro ad effetti impredicibili. 
Quella situazione lì si chiama ***dangling pointer***.
- Se io non rilascio tutta la memoria che ho allocato, faccio un ***memory leakage***.
Memory leakage è uno spreco in primis, ed è un problema in secondis.
Nel momento in cui il mio programma vive abbastanza a lungo, specialmente se sto creando un server. Perché sul server se a ogni richiesta io mi perdo una manciata di byte, dopo un po’ di richieste non ho più.
- Rilasciare la memoria più volte corrompe le strutture dell’heap ed è l’origine del problema del ***Double Free***.

> 💡 **Curiosità**
>
>Agli inizi della storia di Microsoft, Windows NT, aveva un mucchio di leakage e ti dicevano *“Sai che c’è? Ogni notte lo spegni, e poi lo riaccendi”*.
Ma se hai una server farm con 500 macchine, non è molto comodo ricordare di spegnerle tutte e riaccenderle, e inoltre nel tempo in cui Windows NT fa il bootstrap (e ci metteva un bel po’ a farlo) sei completamente out of service.
>
>*E perché si doveva fare?* 
Perché aveva così tanto leakage che se lo facevi girare più di 24 ore lui esauriva tutta la memoria.
>
>Windows NT era comunque un sistema operativo fatto da zero e quindi ci sta che fosse complicato a realizzarlo, però era un problema reale che ha causato danni seri alle aziende che lo usavano, e a Microsoft stessa.



![image.png](images/allocazione_della_memoria_3/image%2025.png)

Se assegno a un puntatore un indirizzo non mappato, o non gli assegno niente e quindi mi tengo un dato a caso che c’è dentro, diventa un ***wild pointer***: non so minimamente cosa possa essere.

## 5.1 Esempi

### 5.1.1 Dangling Pointer

![image.png](images/allocazione_della_memoria_3/image%2026.png)

Ho questo blocco, non ha importanza se è parte di una funzione o di una cosa più o meno complicata. Nello stack c’è già qualcosa, non mi interessa.

![image.png](images/allocazione_della_memoria_3/image%2027.png)

Arrivo a eseguire questa istruzione `char* ptr = null`: lo stack cresce di 8 byte (nel caso di sistema a 64 bit), devo farci stare un puntatore.

Cosa ci metto in questi 8 byte? NULL, ossia 0x0, perfetto.

![image.png](images/allocazione_della_memoria_3/image%2028.png)

Aperta graffa vuol dire che inizia un nuovo **scope sintattico**: le variabili locali dichiarate qua dentro esisteranno fino alla chiusa graffa corrispondente.

Dopo l’aperta graffa c’è `char ch = '!'`: lo stack si abbassa di 1 byte e in quel byte ci scrivo il codice esadecimale 21, che è il punto esclamativo.
E subito dopo dico *“inizializza quel puntatore di prima che valeva* `NULL` *con l’indirizzo di* `ch`*”*.

Vado a vedere quanto vale lo stack pointer che c’è in questo momento (che in pratica è l’indirizzo a cui troviamo il valore di ch), e lo scrivo là dentro.

Quindi il mio puntatore viene sostituito con l’indirizzo giusto di `ch`.

![image.png](images/allocazione_della_memoria_3/image%2029.png)

Chiusa graffa lo stack pointer sale di 1 byte. 
Il puntatore che c’era scritto lì continua a puntare dove non doveva!

![image.png](images/allocazione_della_memoria_3/image%2030.png)

A questo punto provo a chiamare `printf`.

Cosa fa la chiamata printf?
Eh, pusha sullo stack: comincia a metterci lo spazio per il valore di ritorno, l’indirizzo a cui chiamare `printf`, i suoi parametri etc...

Il mio puntatore a questo punto punta delle cose strampalate. Cerco di stampare e non so minimamente che cosa ottengo.

### 5.1.2 Memory Leakage

![image.png](images/allocazione_della_memoria_3/image%2031.png)

![image.png](images/allocazione_della_memoria_3/image%2032.png)

Entro nel mio blocco, dichiaro un puntatore come prima, lo stack cresce di 8 byte, per fare spazio a questo puntatore nullo.

![image.png](images/allocazione_della_memoria_3/image%2033.png)

Alloco un blocco, nello heap da qualche parte cerco un pezzo grande quanto gli ho chiesto, 10 byte. Lo trovo e il mio puntatore punta dove deve.

Nel frattempo la struttura di malloc in questo caso si organizza e si segna che quel segmentino lì adesso è in uso e quindi si segna che deve saltarne un pezzo perché quella memoria non può essere usata in quanto l’ha data in prestito a chi gliel’ha chiesta.

![image.png](images/allocazione_della_memoria_3/image%2034.png)

Dentro quella stringa ci scrivo quello che voglio, non ha importanza, la uso come mi pare.

![image.png](images/allocazione_della_memoria_3/image%2035.png)

La stampo, va tutto bene.

![image.png](images/allocazione_della_memoria_3/image%2036.png)

E ritorno.

A questo punto il mio puntatore viene egettato, non lo posso più restituire perché dove stava questa stringa non lo so più, è perduto per sempre.

La `malloc` è fatta apposta per dare della memoria che potrebbe essere usata per un po’ di tempo e quindi dice *“vabbè, non me l’ha restituita adesso, me la darà dopo..”*, ma noi “dopo” non possiamo più dargliela perché non si sa più dov’è.

Abbiamo fatto del memory leakage.

### 5.1.3 Double free

![image.png](images/allocazione_della_memoria_3/image%2037.png)

![image.png](images/allocazione_della_memoria_3/image%2038.png)

Alloco un primo puntatore, ne alloco un secondo che metto uguale al primo.
Adesso ne ho due che puntano lì.

Di per sé non è una tragedia averne due che puntano lì, posso avere dei motivi validi per farlo: pensate a una double linked list, in cui ciascun blocco è puntato dall’elemento precedente e dall’elemento successivo.

Quindi non è un problema di per sé il fatto che ci sono due puntatori.
Il problema è che devo rilasciare una volta sola.

![image.png](images/allocazione_della_memoria_3/image%2039.png)

![image.png](images/allocazione_della_memoria_3/image%2040.png)

Qui cosa succede?

Uso questa struttura in qualche modo, chiamo la `free` su uno dei due (non importa quale) e a questo punto le strutture di `malloc` prendono il possesso di nuovo di quel blocchettino che avevano segnato prima essere in uso e fin qui va tutto bene.

![image.png](images/allocazione_della_memoria_3/image%2041.png)

Poi faccio la seconda free e a questo punto non capisce più niente, si spacca.

# 6. Gestire i puntatori

![image.png](images/allocazione_della_memoria_3/image%2042.png)

Chi alloca un puntatore è responsabile quindi di mettere in atto un meccanismo che mi garantisca il suo **rilascio**.

Colui che è responsabile del rilascio del blocco viene chiamato ***il possessore***.
**Possedere un blocco vuol dire essere responsabile del rilascio.**

Il possesso non è un diritto, è un dovere.
Certo, ti dà diritto ad accedere al blocco. Ma ti dà anche **il dovere di rilasciarlo.**

Se io questo puntatore che possiede il blocco lo duplico, e quindi a questo punto ho due puntatori che conoscono il blocco, chi è il possessore dei due? Boh.

I linguaggi come Java, i linguaggi *managed*, dicono che il possesso è *equidistribuito*: fin tanto che c’è almeno uno che conosce quel blocco, il blocco non è rilasciabile.
Quando non ci sarà più nessuno che conosce quel blocco, il blocco è rilasciabile perché non è più posseduto.
Piccolo problema: non viene rilasciato subito, è solo segnato come rilasciabile.

Quella memoria diventerà utilizzabile al primo ciclo di garbage collection, che potrebbe avvenire tra un bel po’ e questo potrebbe essere un problema perché io a forza di prendere pezzi di memoria potrei trovarmi in difficoltà.

Quindi in qualche modo se io copio un puntatore che possiede l’indirizzo, cioè è responsabile del rilascio di quella cosa lì, il secondo puntatore si trova malgrado a diventare possessore anche lui, partecipa al ciclo di vita e questo ci fa casino, rende ad esempio scrivere l’algoritmo della linked list non così banale: chi è che rilascia? I puntatori in avanti o i puntatori all’indietro?

Quindi bisogna introdurre un meccanismo che gestisca efficacemente la semantica del puntatore e per questo motivo in Rust i puntatori sono svariati: ci sono i puntatori che posseggono e i puntatori che non posseggono, i puntatori che possono scrivere e i puntatori che possono leggere.

**Rendiamo esplicito nel tipo che cosa puoi fare**, e qui il compilatore ti aiuta perché usa le informazioni che noi gli diamo per verificare che lo usiamo in modo giusto.

![image.png](images/allocazione_della_memoria_3/image%2043.png)

Il vincolo di rilascio è particolarmente problematico per via dell’ambiguità dei puntatori.

In C e in C++ non ho niente che mi distingue un puntatore con possesso da un puntatore senza possesso. Si chiamano tutti `int*`.

Il fatto che uno possegga e l’altro no è solo nella testa del programmatore.

L’ho ottenuto da una variabile locale o una variabile globale che già esisteva, di cui non sono responsabile del rilascio perché lo è il compilatore → non posseggo.
L’ho ottenuto con new o con malloc → posseggo.

Solo che quando sto puntatore passa di mano, chi lo sa più come è nato.
Il tipo non mi dice niente.

Quindi chi è possessore ha la responsabilità di liberarlo.

C++ fa un passo avanti: dice *“guarda io ho i puntatori standard come quelli del C, poi ho gli smart pointer”*.
Gli smart pointer posseggono. Anzi alcuni smart pointer posseggono, perché ce ne è anche un terzo tipo che si chiama **`Weak`** che non possiede: partecipa al ciclo di vita senza possedere.

![image.png](images/allocazione_della_memoria_3/image%2044.png)

Non tutti i puntatori posseggono il blocco a cui puntano.
Se ad un puntatore viene assegnato l’indirizzo di un’altra variabile, la proprietà di quella memoria è della libreria di esecuzione.

Quindi quando dico `int* ptr = &i`, la proprietà è di `i`.

`i` è una variabile che è allocata, è stata allocata dal compilatore e viene rilasciata al compilatore.

Il puntatore è solo un alias.
Può guardarla ma non deve partecipare diversamente.

Tutto si complica se un puntatore che possiede il proprio blocco viene copiato.

Quale delle due copie è responsabile del rilascio?
Tendenzialmente l’ultima. Ma che ne so io qual è l’ultima?

![image.png](images/allocazione_della_memoria_3/image%2045.png)

Nel momento in cui io creo delle strutture dati complesse, come una linked list, come una mappa, come un oggetto più sofisticato, spesso ho bisogno di crearmi qualcosa che punta a qualcos’altro che punta qualcos’altro per poter gestire la semantica di questa faccenda qua.

Ad esempio gli oggetti vector (sono quelli che in Java si chiamano array lists), hanno dentro di sé un puntatore a un blocco dinamico.

Inizialmente piccolo, poi se voi ci mettete dentro delle cose, se per un po’ vengono aggiunti, quando non ci stanno più, quel blocco dinamico viene riallocato grosso il doppio, i vecchi elementi vengono copiati nel blocco nuovo, il blocco vecchio viene rilasciato e faccio spazio per aggiungere cose e quindi piano piano posso ospitare tanti elementi.

Nel momento in cui quel vector viene distrutto, raggiunge la fine del suo ciclo di vita, deve ricordarsi di buttare via tutto.

In qualche modo questo blocco è una dipendenza del vector, quindi la struttura vector ha dentro di sé delle appendici come fosse un grappolo d’uva che dal tralcio si dipana con tanti pezzettini e quando quella cosa lì viene distrutta deve prendersi la briga di buttare via tutti i suoi pezzettini in modo congruo.

Non ci sono solo le dipendenze legate alla memoria, possono esserci dipendenze legate ad altri risorse del sistema operativo.

Se io ho un oggetto che ha aperto un file, quando questo oggetto finisce di vivere quel file deve garantirmi che è chiuso, altrimenti il sistema operativo penserà che quel file lì sia ancora in uso.
Se io ho creato un socket per ricevere dalla rete, analogamente il socket lo devo chiudere.
Se ho creato un thread devo garantire che questo thread abbia finito di vivere e così via.

Quindi questo insieme di cose, di risorse ulteriori, la memoria, i file, i socket, altri pezzi del sistema operativo, che hanno un ciclo di vita che deve essere riportato al ciclo di vita dell’oggetto, prendono il nome di ***dipendenze***.

![image.png](images/allocazione_della_memoria_3/image%2046.png)

C non dà nessun supporto per la gestione delle dipendenze.

C++ ci mette a disposizione il concetto di costruttore e distruttore.
Nel costruttore inizializzo le mie dipendenze, nel distruttore mi libero delle mie dipendenze.

![image.png](images/allocazione_della_memoria_3/image%2047.png)

Innanzitutto, raramente i programmi sono scritti da una persona sola.
Ognuno di tanti che scrive lo fa con le sue convenzioni, con i suoi assunti, con un proprio schema mentale.

Non è detto che i suoi compagni o colleghi li conoscano, non è detto manco che si conoscano reciprocamente, perché io sono subentrato in un’azienda dove ho trovato del software che ha scritto qualcun altro che se ne è già andato da tempo.

Al crescere delle dimensioni del programma la quantità di particolari a cui bisogna badare esplode.

Finché voi avete un puntatore vi prendete la briga di seguirlo, ma quando avete un milione di puntatori che hanno storie diverse, non li seguite manco per idea.

Il 70% delle vulnerabilità elevate all’interno di Windows sono dovute a problemi di gestione della memoria. Non è che Microsoft assume gli imbecilli, ma nonostante ci siano dei professionisti, la possibilità di sbagliare è altissima.

![image.png](images/allocazione_della_memoria_3/image%2048.png)

Nella maggior parte dei linguaggi di alto livello il problema non si pone.

Perché non siete mai stati abbastanza stressati con tutte queste cose?
Eh perché fin tanto che scrivete in Python va tutto bene.

Piccolo problema.
È vero che questi hanno dentro di sé il concetto di puntatore, ma non vi lasciano controllare quando quella memoria viene veramente rilasciata.

E quindi certe cose in Python, in C#, in Java non le potete fare.

In questo corso vogliamo occuparci di quella zona in cui con quei linguaggi lì non si può lavorare, perché abbiamo bisogno di stare più vicini all’hardware.

Il fatto che ci sia il garbage collector libera completamente il programmatore dalla responsabilità del rilascio, ma in compenso ci fa perdere il controllo sul quando e come il rilascio avvenga.

E quindi in generale c’è un bisogno di risorse molto più grande.

La maggior parte di questi linguaggi usa gli algoritmi di ***Mark and Sweep***, che sono quelli che fondamentalmente permettono di identificare quali zone sono ancora referenziate, vengono marcate, e tutto ciò che non viene marcato viene *Sweeped*, scopato via, tolto insieme alla polvere.

Sono algoritmi belli, interessanti, però sono anche estremamente dispendiosi.
Quando parte la garbage collection il programma si deve arrestare.

![image.png](images/allocazione_della_memoria_3/image%2049.png)

Cosa succede tra C/C++, linguaggi che ci danno controllo a basso livello, e Java, piuttosto che C#, piuttosto che Python.

Allora in C++ noi abbiamo un controllo manuale del rilascio. Dobbiamo ricordarci noi di chiamare `delete` o `free` o quello che sia.

Di là ce ne freghiamo attentamente, lo fa il garbage collector. 

Il problema è che in C/C++ noi possiamo controllare quando rilasciare.
Di là, siccome lo fa il garbage collector, la memoria è rilasciata al piacere del garbage collector.

In C++ gli oggetti dispongono di un distruttore, che permette di gestire le dipendenze, di fare il rilascio esplicito delle dipendenze.

In tutti gli altri linguaggi, tranne Java, che ha un finalizer, che però ora è stato deprecato, non c’è il concetto di distruttore.
Non ce n’è bisogno.

In C/C++ il rilascio non comporta dei tempi supplementari di attesa.
Non devo fare una ricerca, perché io ho già la mia ricetta nel distruttore che mi dice cosa devo fare.
Di là, in realtà, il rilascio comporta delle pause, pause che possono essere molto lunghe e che in contesto di realtà sono semplicemente inaccettabili.
Però in C e in C++ possono verificarsi doppi rilasci, memory leakage, dangling pointer, wild pointer e tutte queste serie di cose che abbiamo visto prima. 
Di là no. Motivo per cui, per i programmi applicativi, la strada è quella là.
Per i programmi di sistema, la strada passa di qua.

![image.png](images/allocazione_della_memoria_3/image%2050.png)

*Come sopravviviamo?*

Certamente usando dei programmi che ci aiutano a diagnosticare l’uso della memoria nei processi, come Valgrind, se siamo in Linux, Dr.Memory se siamo su Windows.

Certamente usando dei tipi più sofisticati, invece che `int*`, o cose del genere, cioè il puntatore nativo del C++, le versioni moderne di C++ ci offrono una serie di classi che ci facilitano la vita.

I vari tipi di smart pointer, le tuple, gli iteratori, gli span, gli optional e così via, sono tutti tipi più sofisticati che evitano di dover usare i puntatori, pur dandoci delle strutture che sintatticamente sembrano puntatori e che quindi hanno tante caratteristiche che gli assomigliano, ma sono tracciate per la loro semantica.

Terza strada, ed è quella che seguiremo nel corso, usiamo dei linguaggi che sono intrinsecamente Memory Safe: Rust.

![image.png](images/allocazione_della_memoria_3/image%2051.png)