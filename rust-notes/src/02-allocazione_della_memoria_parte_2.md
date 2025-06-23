# Allocazione della memoria - Malnati 2 <!-- omit in toc -->

# Indice <!-- omit in toc -->
- [1. Modello di esecuzione](#1-modello-di-esecuzione)
- [2. Stack](#2-stack)
	- [2.1 Esempio limite stack](#21-esempio-limite-stack)
- [3. Heap](#3-heap)
	- [3.1 Esempio heap](#31-esempio-heap)
- [4. Organizzazione dello spazio di indirizzamento](#4-organizzazione-dello-spazio-di-indirizzamento)

# 1. Modello di esecuzione

![image.png](images/allocazione_della_memoria_2/image.png)

Ogni linguaggio di programmazione ha un proprio modello specifico di esecuzione, più o meno articolato.

*Che cos’è il **modello di esecuzione**?*
È quell’insieme di comportamenti che l’elaboratore attua a fronte dei costrutti di alto livello che il linguaggio propone. 
Ci sono linguaggi un po’ esoterici che hanno modelli di esecuzione particolari.
Ad esempio il linguaggio Prolog è basato sul concetto di **unificazione** e di **ricerca della prova**, che lo pone a esplorare la sua base di conoscenza usando una serie di regole di produzione, facendo delle cose completamente diverse da quello che fa qualunque altro linguaggio standard che voi conoscete.

Il JavaScript, ad esempio, assume che il programma sia costituito in parte dalle istruzioni immediate che vengono fornite, che possono determinare delle invocazioni di funzioni, che possono avere degli effetti sul futuro, per cui mantiene al suo interno una coda degli eventi nella quale vengono pubblicate le cose che succederanno.
E attinge da questa coda per fare le proprie operazioni.
Questo tipo di comportamento non si ritrova altrove, se non adottando delle librerie che lo vadano a emulare, mentre nel JavaScript è intrinseco nel linguaggio stesso.

E così via.

Il modello che ciascun linguaggio propone, in generale, non corrisponde neanche un po’ al dispositivo reale. 
Il compilatore si prende la briga di trasformare le istruzioni scritte nel linguaggio di alto livello X in comportamenti tipici di un particolare processore.
Questa trasformazione in parte è legata alla sequenza di istruzioni che vengono generate per ciascun costrutto di alto livello (quando qui scrivo for, cosa genero? Quando qui scrivo if, cosa genero? Eccetera..).

In parte è dovuta al fatto che inframezzate a queste istruzioni, che sono la traduzione diretta dei costrutti di alto livello del linguaggio, vengono messe chiamate a libreria, che servono a garantire che certe cose avvengano come debbono avvenire.
Questi pezzi di chiamate a libreria, che sono inserite automaticamente dal compilatore, servono a generare questa astrazione, a fare in modo che l’astrazione funzioni.
La libreria prende il nome di ***RTL***, *Runtime Support Library*, o *Runtime Library* semplicemente, e dipende dai diversi linguaggi.

![image.png](images/allocazione_della_memoria_2/image%201.png)

Quindi quello che succede è che la compilazione trasforma il programma sorgente che noi abbiamo scritto in un nuovo programma, che ha un modello di esecuzione più semplice, e che è associato a una libreria di esecuzione scritta specificatamente per quel particolare sottosistema.

Notate che il livello più semplice può voler dire cose molto diverse.

Può voler dire, ad esempio, che è direttamente eseguibile da un particolare elaboratore, oppure che può essere eseguito attraverso l’intervento di un programma ulteriore che lo abbassa di livello.

Nel caso di Java, voi compilate il vostro programma in bytecode, e poi la JVM, la Java Virtual Machine, traduce questo bytecode, just in time, in codice eseguibile per l’elaboratore concreto.

Che poi va in esecuzione.

Va in esecuzione su una macchina fisica? Forse.
A volte va in esecuzione su una macchina virtuale.

A volte c’è un ulteriore livello.
Ad esempio, sui Mac che montano l’ARM, c’è un software chiamato Rosetta, che trasforma dei programmi eseguibili x86 in ARM.
E quindi, ignorando tutto il resto, guarda “Ah, questa qui è l’istruzione *LOAD SP qualcosa*. Magnifico!”. Qual è il corrispondente ARM? Non c’è, e allora simulo: diventa queste altre tre istruzioncine.
Però dà la possibilità di poter lanciare qua un programma scritto per la versione macOS x86, pur avendo un processore completamente diverso.

A volte questa trasformazione è fatta nel contesto di una virtual machine, perché avete lanciato, che ne so, VirtualBox o qualcosa di simile, Docker, e così via.
Contesti che ulteriormente trasformano di livello in livello.

![image.png](images/allocazione_della_memoria_2/image%202.png)

Cosa c’è nelle librerie di esecuzione?
Beh, ci sono quei meccanismi di base che permettono ai programmi di alto livello di funzionare come ci aspettiamo che funzionino.
Da un lato supportano le astrazioni che quel particolare linguaggio vuole offrire, dall’altro si prendono la briga di interfacciarsi col sistema operativo nascondendo le differenze.

Per cui se voi dovete aprire un file, in C, scrivete sempre `fopen`, non preoccupandovi del fatto che su Windows quella `fopen` in alcuni casi diventa `Create File`, e invece su Linux quella `fopen` diventa una `Open`, System Call di livello 2.

Perché questo livello di dettaglio il linguaggio ve lo nasconde, almeno in parte.

All’interno delle librerie di esecuzione troviamo due tipologie di funzioni.
Alcune sono completamente invisibili al programmatore, vengono inserite automaticamente dal compilatore per supportare l’esecuzione.
Ad esempio, tutte le volte che voi chiamate una funzione, nella chiamata c’è anche un pezzo di codice che va a vedere “*sto mica facendo traboccare lo stack?”*, perché se trabocca lo stack perdo dei dati e quindi il programma deve interrompersi.

Oppure, ce ne sono altre per cui quando assegnate a una struttura un’altra struttura, lì bisogna fare una memcpy, e viene fatta in automatico: voi scrivete a=b, vi perdete il dettaglio che a sono 200 byte e b anche, e che lui li deve copiare sopra.
Ci pensa il compilatore a generare questo pezzo di operazione.

Altre sono invece evidenti al programmatore, come la `fopen`, per cui il linguaggio vi espone un’astrazione di alto livello, e si prende poi lui la briga di tradurla nel dettaglio che serve per il sistema operativo X, o cose del genere. Fopen, malloc, e così via.

![image.png](images/allocazione_della_memoria_2/image%203.png)

Nel linguaggio C e C++, l’astrazione che viene offerta al programmatore è quella che il programma si presenta come se fosse l’esecutore, l’utilizzatore unico dell’intero sistema, che si immagina completamente dedicato al programma stesso.

Quindi il programma crede di aver accesso all’intero spazio di indirizzamento, i puntatori vi lasciano scrivere un numero qualunque tra 0 e 2 alla n-1, potete immaginare di allocare quanta memoria vi pare, potete pensare di avere tutto il tempo che volete.

Il fatto che poi fisicamente voi non possiate impicciare gli altri è garantito dal sistema operativo che, adottando il meccanismo della memoria virtuale, confina l’esecuzione del singolo programma nel suo spazietto e impedisce che questo interferisca con altri.

Il fatto che i puntatori potenzialmente possono contenere qualunque numero compreso tra 0 e 2 alla n-1 dà l’impressione che sia lecito andare a cedere a qualunque locazione.
Ma sappiamo che non è così.

I limiti, gli indirizzi effettivamente accessibili sono molti molti di meno e sono uno spazio sparso, proprio come disegnato prima nella slide, a pezzettini.
Tra l’altro ogni volta in posti leggermente diversi.

Perché in posti leggermente diversi?
E’ sempre per difendersi dai virus. Inizialmente non era così. I sistemi operativi allocavano a un indirizzo specifico il punto di partenza del programma. E i virus lì ci si buttavano a capofitto.

E allora i programmi, i sistemi operativi, hanno introdotto la randomizzazione per cui il programma inizia a una certa cella più o meno delta, dove delta è random. Questo sposta un po’ le cose e rende più difficile la vita ai virus. 

![image.png](images/allocazione_della_memoria_2/image%204.png)

Il C, mi presenta un’astrazione tipica in cui io scrivo delle istruzioni di alto livello che posso immaginare essere eseguite una per volta nell’ordine indicato dal programmatore.

Quindi se ho scritto:

```c
if A > B {
	printf(...);
else {
	// etc..
}
```

immagino che le cose vanno esattamente nell’ordine in cui le ho scritte.

Non è detto che succeda quello.
Perché **il compilatore** può decidere che certe cose, fin tanto che nessuno se ne accorge, le può scambiare.

**Il processore** può decidere che, fin tanto che nessuno se ne accorge, può fare delle cose diverse (varie tecniche di ottimizzazione: dei branch, esecuzione speculativa, etc..).

Non è detto che se scrivo `i=25`, 25 venga scritto dentro i.

Perché il processore o il compilatore hanno la facoltà, fin tanto che non rompono l’astrazione sequenziale, di riordinare i pezzi lì dentro.

Se tu mi dici, prima scrivi qui e poi scrivi lì, e qui e lì sono due cose distinte, beh, chi se ne frega, le posso scambiare. Tanto che differenza fa?
Fin tanto che il programma è costituito da un unico flusso di elaborazione, non fa nessuna differenza.

Ma se il programma è costituito da due flussi di elaborazione, e i due flussi possono *osservarsi*, cioè io posso vedere cosa tu stai facendo, il fatto che tu prima abbia scritto in un posto e poi nell’altro mi cambia la vita.

Non ci sono limiti sul numero di istruzioni da eseguire, sul tempo richiesto all’esecuzione, né sulla memoria necessaria: io scrivo il mio programma così com’è, il linguaggio non mi dà evidenza. Ma i limiti esistono.
E il programmatore deve capire, perché se io devo garantire che quella roba lì mi gestisce l’ABS, per stare nell’esempio di prima, deve gestirmi l’ABS, sempre.

All’interno del flusso principale di esecuzione possiamo abilitare degli ulteriori flussi di esecuzione secondari, chiamati **thread**.
Questi permettono di fare più cose quasi contemporaneamente.
Davvero in parallelo se la CPU è multicore, o alternando un po’ l’una e un po’ l’altra cosa se la CPU non è multicore. 
E, come abbiamo già avuto modo di dire prima, introducono un ordine di grandezza nella complessità del programma, creando delle situazioni completamente inattese.

![image.png](images/allocazione_della_memoria_2/image%205.png)

Il singolo flusso di esecuzione standard di un programma C o C++ è costituito da una computazione che si dipana dalla funzione main.
Noi abbiamo l’impressione che il nostro programma incominci invocando il main e termini nel momento in cui il main finisce.

Non è così.
Ci possono essere delle parti che vengono eseguite prima, anzi ce ne sono sicuramente parti che vengono eseguite prima, sia di sistema sia aggiunte da noi.
Ci sono delle parti che vengono eseguite dopo, sia di sistema sia da noi.

Ad esempio, se sono in C++ e ho costruito delle variabili globali di tipo classe, queste possono avere un costruttore.
Il costruttore delle variabili globali viene invocato prima che il main parta.
Il distruttore delle variabili globali viene invocato dopo che il main è terminato.

Quindi già questo mi cambia un po’ le carte in tavola.

Ma prima che il costruttore venga chiamato parte la funzione di setup del sistema operativo che mi prepara l’ambiente di esecuzione e fa cose.

In più, il C e il C++ assumono l’esistenza di due strutture dati ausiliarie.

- Una a forma di pila, chiamata lo **stack**, che serve a gestire le chiamate, la storia delle chiamate (e quindi dei punti di ritorno), e le variabili locali.
In C++, all’interno dello stack, è anche gestita la parte, la gestione strutturata delle eccezioni.
- E una seconda struttura ausiliaria, lo **heap**, che serve a usare la memoria dinamica.

Queste due strutture crescono e si contraggono via via che il programma va in esecuzione.
Mentre lo stack è fortemente prevedibile e, a fisarmonica, si allarga e comprime, in modo compatto, lo heap evolve in modo non compatto, sotto il controllo del programmatore. Che quindi diventa responsabile della sua gestione.

# 2. Stack

![image.png](images/allocazione_della_memoria_2/image%206.png)

Lo stack è un blocco che viene allocato automaticamente all’avvio del programma.

Lì dentro c’è la storia delle chiamate a funzione, degli argomenti passati a ciascuna funzione, dei valori di ritorno, delle variabili locali e così via.
Viene utilizzato a partire da un estremo, si espande verso il basso e si contrae quando le funzioni ritornano.

Poiché la dimensione è finita, limita la profondità della ricorsione. 
Così anche come la dimensione delle variabili che possono essere allocate come variabili locali.

## 2.1 Esempio limite stack

![image.png](images/allocazione_della_memoria_2/image%207.png)

Questa funzione f alloca una variabile locale. Supponiamo `uint_8t`, un intero a 8 bit, quindi un byte, e lo chiamiamo `buffer`, di 1024 per 1024. È un array di un mega.

Quando io chiamo f di 1, quello che succede è che verrà chiamato, entro dentro f, alloco questa cosa. Poi stampo quanto vale i. Poi mi chiamo ricorsivamente f con `i+1`.

Questo cosa vuol dire?
Che io ho invocato f nel main, che ha preso il suo simpatico buffer da un mega, mi stampa 1 e poi si richiama.

Cosa succede richiamandosi?
Che alloca un altro buffer da un mega, stampa 2 e poi si richiama. E alloca un altro buffer da un mega.

Quando si romperà questa ricorsione?
Alla settima chiamata.

`Program finished with the exit code 139 (interrupted by signal 11: SIGSEGV)` → ***Segment violation***.

Ho messo 7 blocchi da un mega e mentre cercavo di mettere l’ottavo ho già traboccato.

Perché in realtà lo stack, sulla macchina su cui stiamo eseguendo l’esempio, è esattamente 8MB, ma ad ogni array da 1MB che allochiamo si aggiungono qualche byte in cui c’è l’indirizzo di ritorno, perché via via che mi chiamo la funzione f devo scrivere dove devo tornare, poi c’è lo spazio per la variabile i che devo passare, quindi si mangia una decina di byte in più a giro, e quindi in realtà l’ottavo non ci sta, perché quando cerco di allocarlo, vado fuori.

Questo ci dice che noi sullo stack più di 8MB non mettiamo.

![image.png](images/allocazione_della_memoria_2/image%208.png)

Chiaramente se invece di mettere 1024 per 1024 mettiamo di meno, qui arriva. 
Non arriva a 8 mila, si ferma prima a 7800.

Perché?
Perché adesso i 12 byte in realtà di overhead che io ho, 8 per il ritorno più 4 dell’intero, a ogni giro, pesano di più. 
Perché sono 12 su 1024. Prima erano 12 su 1 mega, quindi erano una frazione piccola.

![image.png](images/allocazione_della_memoria_2/image%209.png)

Adesso se addirittura abbatto e qui scendo a 1, e quindi ho messo un singolo byte, non arrivo a 8 milioni. Arrivo molto prima.

Questo ci dice che lo stack è limitato. Non possiamo permetterci di ricorrere più di tanto. Non possiamo allocare sullo stack cose grosse. O perlomeno se lo facciamo dobbiamo farlo un po’ con cautela, altrimenti si spacca.

![image.png](images/allocazione_della_memoria_2/image%2010.png)

Questo tipo di situazione si chiama stack overflow: lo stack trabocca.

![image.png](images/allocazione_della_memoria_2/image%2011.png)

Quando il nostro programma parte, lo stack **non è vuoto**. 
C’è già l’indirizzo a cui la funzione main dovrà ritornare, perché la funzione main non è l’inizio del nostro programma.

L’inizio del nostro programma è un pezzo di funzione che dipende dal sistema operativo, che può chiamarsi *CRT startup* (CRT → C Runtime) o qualcosa del genere, che serve a preparare lo stack, lo heap, insomma a costruire tutti i pezzi che servono e poi dopo che ha fatto tutto, chiama il main.

Quindi quando il main arriva, sullo stack già c’è l’indirizzo a cui dovrà tornare, perché il main finisce con una `return 0`. 
E dopo che il main è ritornato, quello 0 servirà per far sapere come finisce il nostro processo: diventerà l’exit code del processo.

Comunque, il main parte e sullo stack già c’è qualcosa.

![image.png](images/allocazione_della_memoria_2/image%2012.png)

Poi qui, la prima cosa che succede, viene dichiarato una variabile locale, int v=9. Lo stack cresce. Si allunga e lì ci infilo v, che vale 9.

![image.png](images/allocazione_della_memoria_2/image%2013.png)

Poi dico `v = f(v)`.

Per poter chiamare f(v) devo fare un po’ di pezzi. Siccome f(v) restituirà qualcosa, mi darà un valore di ritorno, devo prima di tutto fare uno spazio dove questo valore di ritorno verrà scritto. Ci sono quei tre puntini chiamati `res`: è il posto dove lì depositerò il mio risultato. Cioè il risultato che f avrà. Io devo prepararlo prima lo spazio.

Poi siccome a f passo un parametro, devo metterglielo. Devo metterglielo perché io potrei passargli v, ma potrei passargli v+1, potrei passargli v per 5 diviso 54.
Quindi di per sé quella roba lì è un’espressione.
Quindi valuterò l’espressione, metterò il risultato dell’espressione sullo stack.

f ancora non l’ho chiamata, ma ho già preparato i pezzi perché possa essere eseguita.

![image.png](images/allocazione_della_memoria_2/image%2014.png)

Dopo che ho fatto spazio per il posto di ritorno, ho messo tutti i parametri di cui la mia funzione f ha bisogno, posso effettivamente eseguire l’istruzione assembler `call`.

L’istruzione assembler call fa sì che nello stack venga aggiunto il valore dell’instruction pointer aggiornato, cioè la prossima istruzione che dovrò eseguire quando f sarà finita.

Quindi lo stack è cresciuto ulteriormente.
Mi è entrato dentro l’indirizzo di ritorno che punta a quello che dovrò fare, prendere il valore che f restituisce e metterlo dentro v, e l’instruction pointer si è trasferito all’inizio di f.

![image.png](images/allocazione_della_memoria_2/image%2015.png)

Entrando dentro f, f dice “*a me serve una variabile i*”.
Notate che f, il suo parametro (che per l’altro era il risultato dell’espressione v nell’invocazione della funzione) l’ha chiamato a. Ma sono la stessa cosa.

Quindi quel 9 che c’è lì prima del return address, nel contesto di f, si chiama a. 
f dice “*a me serve una variabile locale, che chiamo i*”.
Lo stack cresce ancora. Lo piazzo lì.

![image.png](images/allocazione_della_memoria_2/image%2016.png)

Poi c’è un if: `a` è maggiore di 0 (vale 9), quindi salta direttamente al blocco then, e dice “*return a+i*”.

Aspetta, a+i: calcoliamo questa espressione — `a` vale 9, `i` vale 5, `a+i` vale 14.

*Dove lo scrivo sto 14?*
Al posto dei tre puntini, là dove già avevo lo spazio.

Sono tutti indirizzi relativi alla cima dello stack.
Altrimenti ritornerei un’altra cosa.

Ma return non solo dice il valore, quindi prende a+i, 14, e lo scrive nello spazio dei tre puntini.
Ma dice anche “piantala lì”.

Piantala lì cosa vuol dire? Vuol dire che lo stack deve contrarsi.
Nel tornare al livello, i viene egettata, sparisce.
L’indirizzo di ritorno viene preso e messo nell’instruction pointer.

In modo tale che lui vada a eseguire quell’istruzione lì, al ciclo prossimo.

![image.png](images/allocazione_della_memoria_2/image%2017.png)

Torno all’altezza dell’uguale. All’altezza dell’uguale vengono fatte due operazioni.
Si prende quello che c’era nei tre puntini e lo si deposita, in questo caso, dentro `v`.
E si tira via quello che, quel pezzo di incastellatura che era stata fatta per poter chiamare f.

Quando ho chiamato f, ho preparato lo spazio per il valore di ritorno, ho preparato lo spazio del suo parametro, e poi ho chiamato fisicamente f.

Quando f ritorna, tiro via automaticamente l’indirizzo di ritorno, perché quello è l’esecuzione dell’istruzione assembler ret, return, che mi fa tornare al mio posto, ma nel posto in cui atterro, così come prima erano stati messi delle istruzioni assembler che mi dicevano “infila questo, infila quello” sullo stack, subito prima di poter fare le altre cose, ora fa “togli questo, togli quello” e mi ripulisce la situazione.

Quindi al termine della chiamata di f io vedo lo stack come era prima che la facessi.

![image.png](images/allocazione_della_memoria_2/image%2018.png)

Dopodiché qui ho finito questa cosa, `return 0`, lo zero viene messo nello spazio dove lui può già tornare, che era stato preallocato dal chiamante, la CRT Startup. 

![image.png](images/allocazione_della_memoria_2/image%2019.png)

E infine lo stack si contrae, lasciando spazio in questo caso solo allo zero, perché lo zero me l’aveva messo il chiamante e lo deve trovare lui ancora, perché poi lo toglierà lui.

Questa è la storia dello stack.

Quindi lo stack si allunga ogni volta che dichiaro una variabile locale, si contrae quando la variabile locale non si vede più.

Attenzione: se la variabile locale è definita in un blocco, quindi 

```c
if (somecondition) {
	int i
} // finisce di vivere qui
```

quella `i` inizia a esistere mentre entro dentro il then dell’if, e finisce di esistere quando arrivo alla chiusa graffa corrispondente.
Quindi **non tutte le variabili locali durano quanto l’intera funzione.**
Le variabili che sono definite in un blocco durano quanto il blocco.
Appena l’esecuzione raggiunge la chiusa graffa del blocco, quelle variabili vengono espulse.

Se ho una variabile locale dentro un for, k viene creata e distrutta dieci volte.

```c
for i=0, i<10, i++ {
	int k = something // k creata e distrutta ad ogni iterazione del for
}
```

Quindi quello stack per dieci volte fa, si allunga, si accorcia, si allunga un po’ di cose e si accorcia, eccetera, e va avanti così.

Quindi la durata in vita delle variabili locali è circondata, cioè è delimitata dal tempo in cui il programma sta nel blocco in cui sono definite.

Chiaramente, in questo caso, la variabile `v` che inizia all’inizio del main ragionevolmente dura fino a che non raggiungo la fine del main. È una variabile che ha una vita più lunga.

La variabile `i` che è nella funzione f esiste soltanto mentre è in corso una chiamata f. Una volta che la chiamata f è finita, la variabile `i` non esiste più.

Questo ci fa intravedere qualche possibile problema.
Se la funzione f, invece di ritornare un intero, ritornasse un puntatore e scegliesse per qualche motivo di ritornare come puntatore l’indirizzo della variabile `i`, sarebbe un problema.

*Perché?*
Certamente mentre la funzione f è in esecuzione, la variabile `i` esiste e ha un suo indirizzo. Non sappiamo qual è, ma fa lo stesso. Nel momento in cui va in esecuzione lo saprà.

Piccolo problema: lo può ritornare quel puntatore, è un numero, quindi come ritorno 5 ritorno anche un’altra cosa. Ma quel numero lì appena f ritorna, non rappresenta più una locazione lecita, perché in quello spazio lì io potrei farci altro, dipende da cosa c’è scritto dopo.

Quindi questo ci pone il problema di dire: *ma i puntatori come funzionano?*

![image.png](images/allocazione_della_memoria_2/image%2020.png)

Quindi, il fatto che lo stack cresca a fisarmonica fa sì che allocazione e rilascio siano due operazioni efficientissime.

Perché?
Perché se io ho bisogno di spazio devo solo incrementare lo stack pointer (o decrementarlo, visto che in realtà vado verso il basso).

Lo stack pointer parte da 7FFFFFFF e scende verso il basso.
Quindi farmi spazio sullo stack pointer equivale a sottrarre dallo stack pointer il delta di cui ho bisogno.
Liberare memoria vuol dire sommare allo stack pointer per farlo tornare verso l’alto.

Però ho un vincolo. I dati che sono nello stack durano solo, al massimo, quanto l’intera funzione in cui sono definiti. In realtà durano quanto il blocco in cui sono definiti, che può essere molto meno della funzione.

Quindi se io ho bisogno di salvarmi un’informazione che dura più a lungo, ecco lì me la perdo.
Per questo motivo il valore di ritorno è **preallocato dal chiamante**. Così quel dato lì mi rimane.

E il chiamante usa quello spazio per poi metterci quello che è, per prendere poi il risultato e poi lo libera.

Inoltre, poiché lo spazio totale dello stack è definito a priori, il sistema operativo quando il programma parte stabilisce quanto è grande lo stack, abbiamo visto sulla macchina dell’esempio di prima sono 8MB, quello lì è il dato più grande che ci posso mettere.

Se avessi bisogno, che ne so, perché sto facendo un film e ho bisogno di tenerci 64GB, o sto facendo un modello LLM, che ne so, qualunque cosa che ha bisogno di memoria, sullo stack non ce lo metto.

# 3. Heap

![image.png](images/allocazione_della_memoria_2/image%2021.png)

C’è una seconda struttura però che ci interessa tantissimo, si chiama lo heap.

Heap vuol dire il mucchio, dove le cose sono buttate così, una a fianco all’altra, come capita.

Tutte le volte in cui un dato ha un ciclo di vita che non è collegato alla funzione in cui quel dato nasce, oppure, pur essendo legato a quella funzione, è grosso e quindi potenzialmente mi potrebbe provocare uno stack overflow, oppure ha una dimensione che al momento della compilazione non è nota (e quindi ho bisogno di allocare un certo numero di byte, ma quanti esattamente lo saprò solo a run time, deducendolo da uno dei parametri), quella cosa lì non può stare sullo stack, perché il compilatore non ha abbastanza informazioni per poterla fare. 
Se non è nota la size, io non so di quanto abbassare lo stack e quindi non ce lo posso mettere lì dentro, oppure, se me lo può mandare in overflow, non ce lo devo mettere perché se no mi spacca tutto, oppure, se il suo tempo di vita non è collegato all’esecuzione della funzione, devo metterlo da un’altra parte dove abbia un tempo di vita possibilmente più lungo, o a volte più breve, perché magari mi serve solo all’inizio della mia funzione, ma non esattamente in questo blocco, in una zona un po’ più indefinita che non coincide proprio con un blocco.

Quindi lo devo tenere altrove.

Nel caso di C, C++ e Rust, questa zona a parte si chiama heap, o anche in alcuni libri è chiamato free store, sono la stessa cosa.

Lì dentro si ottiene un blocco di memoria che rimane disponibile fino a che esplicitamente non gli diciamo “*basta, non mi serve più*”.

Lo heap ha più spazio dello stack.

Quanto di più? Dipende. 
In generale noi sappiamo che è più grande. Le cose grosse devono andare nello heap.

Ci sta qualunque cosa, dipende dal sistema operativo.

Se faccio le prove qua su macOS posso provare ad allocare 1000 giga, un tera. Mi dice “yes”, me le fa allocare. Poi quando vado dentro a un certo punto si rompe, ma allocare me le lascia allocare.

A differenza di quanto avviene per lo stack, dove le singole aree hanno un nome, ed è il nome della variabile che abbiamo messo, per cui quella cosa lì noi la chiamiamo i, j, k, l etc.. come i nomi che gli abbiamo dato, e lui internamente le fa diventare bp+4, bp+8, cose del genere, le zone sullo heap **non hanno un nome**, sono **solo accessibili tramite dei puntatori**.

Io chiedo di avere un blocco grande 64 byte, mi viene restituito il puntatore all’inizio di questo blocco. Lo devo memorizzare in una variabile di tipo `qualcosa *` : `int *`, `uint8 *` etc.. ma una variabile di tipo puntatore.

Per accedere al suo contenuto dovrò ***dereferenziare*** il puntatore.

Se la mia variabile di tipo int* si chiama `ptr`, per sapere cosa c’è scritto dentro o per scriverci qualcosa dentro, devo mettere `*ptr`, cioè devo dereferenziarlo, dire “*prendi quel numero lì, consideralo indice nello spazio di indirizzamento e vai a vedere*”.

Questo è il primo problema, quindi necessariamente se devo manipolare dati grossi che hanno durata diversa da quella di una funzione o hanno dimensione non nota in fase di compilazione, devo avere dei puntatori tra le mani.

Secondo problema, questi puntatori inizialmente devo richiederne l’uso allocando in modo esplicito la memoria, invocando la funzione che va a cercare un posto e mi restituisce l’indirizzo del punto d’inizio.

E ho la responsabilità prima o poi di rilasciarli, cioè di dire “*runtime execution environment, sappi che questa zona non mi serve più, te la restituisco, potrebbe servire a qualcun altro”.*

Notate che il riciclo è il principio fondamentale, sullo stack il riciclo è frequentissimo, io chiamo la funzione f, usa lo stack per farci delle cose allungandolo, la funzione f ritorna, lo stack si ricontrae, e poi dopo aver chiamato la funzione f chiamo la funzione g, lo stack si riespande e va a occupare gli stessi spazi che prima usava la funzione f, ma ormai la funzione f è ritornata, chi se ne frega, va benissimo, quindi quella zona lì è usata più e più volte, ed è il motivo per cui è pericolosissimo lasciare dei puntatori sparsi nello stack, perché io ti lascio adesso questo dato, che vale una certa cosa, ma poi io torno, è rimasto un puntatore farlocco, parte qualcun altro che in quella zona scrive altre cose, quindi quel puntatore non so più che cosa contiene.

Sullo heap anche, solo che mentre sullo stack io non devo fare nulla per causare questo riciclo, sullo heap il riciclo lo devo provocare io dicendo “*tu mi hai dato questa zona, io l’ho usata, adesso non mi serve più, te la restituisco*”, e questo permetterà, dopo che io ho restituito un blocco di memoria, se da qualche altra parte del mio programma servirà dell’altra memoria, di poterla eventualmente riusare.

Se io non rilascio la memoria, cosa succede?
Beh, il sistema operativo dice “*ne hai bisogno ancora? tienila, non c’è problema*”.

Piccolo problema, se io ne chiedo un pezzo, ok, ne chiedo un altro, ok, ne chiedo un altro, eccetera, lo heap è esattamente come lo stack: ha dimensione, **finita**.

E’ molto più grande dello stack, ma è finito, e dopo un po’ si esaurisce. 
Esaurendosi, verrà il momento in cui gli chiedo ancora un pezzo, ma non ne ha più.

E a quel punto il programma si rompe, proprio come si rompe con lo stack overflow.

C’è una responsabilità in più: io lo devo rilasciare **una e una sola volta**.
Non meno- [Allocazione della memoria - Malnati 2](#allocazione-della-memoria---malnati-2)
- [1. Modello di esecuzione](#1-modello-di-esecuzione)
- [2. Stack](#2-stack)
	- [2.1 Esempio limite stack](#21-esempio-limite-stack)
- [3. Heap](#3-heap)
	- [3.1 Esempio heap](#31-esempio-heap)
- [4. Organizzazione dello spazio di indirizzamento](#4-organizzazione-dello-spazio-di-indirizzamento)

E vengono dei mostri. Per cui il programma compila, e poi quando esegue capitano cose a caso. Questi sono gli **undefined behavior**.

## 3.1 Esempio heap

![image.png](images/allocazione_della_memoria_2/image%2022.png)

![image.png](images/allocazione_della_memoria_2/image%2023.png)

Vediamo la storia dello heap.

Ripartiamo con la nostra, con il nostro main.

Parto al solito con lo spazio per valore di ritorno, alloco la variabile locale V, sta nello stack esattamente come prima.

![image.png](images/allocazione_della_memoria_2/image%2024.png)

Poi chiamo, introduco la variabile `buf` che è di tipo int*. 
Quindi lo stack cresce per avere spazio per la variabile buf.

E a quanto inizializzo la variabile buf? La inizializzo con il valore di ritorno di f di V.
Dunque devo chiamare f e passargli V. E mi serve un valore di ritorno.

Quindi non solo sullo stack ho messo buf, ma faccio anche spazio per `res`, il posto dove verrà messo il ritorno, e faccio anche lo spazio per il parametro di f, che in questo caso è il risultato dell’espressione `v`, che vale 2.

E quindi preparo questi tre pezzi. 

![image.png](images/allocazione_della_memoria_2/image%2025.png)

E poi fisicamente chiamo f. Quindi lo stack cresce ancora e ci metto l’indirizzo di ritorno.
Adesso che ho fatto tutte queste simpatiche cose, vedo cosa succede dentro f.

![image.png](images/allocazione_della_memoria_2/image%2026.png)

Che fa f?
Guarda al solito se A è maggiore di 0 e chiede di allocare un blocco di memoria.

Qui lo faccio con la sintassi del C++: `new int[a];`
Quel new vuol dire “*lo alloco nello heap*”.

Che cosa alloco? Un array di interi.

Quanti interi? Eh non lo so. A differenza dell’esempio che vi ho fatto vedere prima con lo stack overflow, dove scrivevo `uint8_t[1024x1024]`, lo sapevo in compilazione, faceva un milione qualcosa, qui è int di a.

A runtime lo saprò, in questo caso è 2. In un altro caso potrebbe essere 27, o 2500 etc...

Questa scrittura mi permette di andare a cercare sullo heap da qualche parte dove c’è un blocco con almeno due interi vicini disponibile.

Quindi `new int[a]` trova sullo heap uno spazio sufficiente per tenermi due interi, in questo caso.
Prende il puntatore al primo, al byte iniziale del primo intero, e me lo restituisce.

Cosa me ne faccio di questo valore restituito?
Lo passo al return, che quindi lo deposita nell’apposita casellina che il chiamante mi ha preparato per mettere il risultato.

E quindi ci mette dentro questo. 

![image.png](images/allocazione_della_memoria_2/image%2027.png)

E poi contrae tutto.

Quindi contrae tutto, torno al chiamante, cosa succede?
Il chiamante prende il valore che era stato restituito e lo deposita, in questo caso dentro buff.

Quindi adesso mi ritrovo che buff punta da qualche parte nella memoria, dove ci sono due interi, quello che gli ho chiesto.

Bene. Che faccio?
Quello che voglio, lo uso, f è tornata ma buf è ancora lì, tranquillo.

Quindi ho in questo caso sia una variabile la cui dimensione è nota solo a run time, sia la cui durata è più lunga della funzione in cui è nata.

La memoria puntata da buf nasce nella funzione f ma rimane in vita, accessibile, dopo che la funzione f è finita.

Faccio tutto quello che devo all’interno di quella memoria, quando non mi serve più ho la responsabilità di rilasciarla.

![image.png](images/allocazione_della_memoria_2/image%2028.png)

Come la rilascio? L’ho creato con new, lo rilascio con `delete`.

Delete vuol dire “*quell’array lì non mi serve, buttalo via*”. Il sistema operativo prende atto e rilascia la memoria, si segna che non è più in uso, e la può dare a un altro se ne avesse bisogno.

**Attenzione**: dentro buf però è rimasto il numerino che c’era prima, non è che è sparito, dentro buf supponiamo che la new avesse trovato uno spazio all’indirizzo 3b7f59: quello è scritto dentro buf.

Se non ci sto attento, io vedo che dentro buf c’è un valore lecito, e potrei cercare di guardare dove punta, ma adesso punta a casa di altri!

![image.png](images/allocazione_della_memoria_2/image%2029.png)

Qui va tutto bene perché scrivo return 0, quindi metto 0 nella celletta che mi è stata preparata per il valore di ritorno, contraggo lo stack e ho finito.

# 4. Organizzazione dello spazio di indirizzamento

![image.png](images/allocazione_della_memoria_2/image%2030.png)

Cosa ci trovo nello spazio di indirizzamento?

Un po’ di cose:

- il **codice eseguibile**, tutte le istruzioni che sono state generate tipicamente sono scritte in modo compatto, vicino una all’altra per convenienza, tipicamente questa zona qui ha un accesso che è in lettura e in esecuzione, ma non in scrittura.
- l’**area delle costanti**, che è un blocco, se io nel programma ho dichiarato una serie di costanti (es. `const float p=3.14`), ecco, quella zona lì è una zona di nuovo che viene compattata insieme, e che viene marcata come read only, in modo da non rischiare di sporcarla.
- una zona dentro cui ci sono le **variabili globali**, ammesso di averne scritta qualcuna, che è una zona in lettura e scrittura.
- lo **stack**, che è una zona accessibile in lettura e scrittura preallocata di una certa dimensione.
- lo **heap**, che è una zona disponibile in lettura e scrittura, di per sé molto grande, ma in cui non ho diritto di scrivere e leggere dove cavolo voglio. Perché è soggetta ai limiti del fatto che il sistema, la runtime library, me le dà lui o lei che sia, quei pezzettini, che io gli vado a chiedere chiamando `new` e rilascio con `delete`, oppure se sono in C, che chiedo con `malloc` e rilascio con `free`. Quindi devo farci un po’ di attenzione.

![image.png](images/allocazione_della_memoria_2/image%2031.png)

Come sono messe queste aree?
Ogni sistema operativo le sceglie a modo proprio. In Linux è molto facile vederle.

Se voi prendete un processo qualunque di quelli esistenti, in una macchina Linux o una macchina virtuale, andate a guardare nel file system, trovate che nel file system c’è una cartella che si chiama /proc. /proc contiene degli pseudo directory, cui nome è un numero, 27521760.

Quei numerini lì sono semplicemente i process ID dei processi attualmente in funzione.
È una cartella fittizia, non corrisponde a un vero dato sul disco, è il modo con cui il sistema operativo permette l’introspezione, cioè vi fa vedere com’è fatto.

Se prendete un processo che esiste, qui io banalmente quando ho stampato sta cosa avevo in esecuzione un processo che si chiamava 4742, dentro questa pseudo cartella c’è un altro file che si chiama /maps.

È un file di testo, è sempre un file virtuale che viene generato.
Dentro vi mette una per riga i blocchi dello spazio di indirizzamento in uso.

In questo caso cosa ci trovo?
C’erano un po’ di cose, qui adesso condensate per stare nella slide, e ho messo in evidenza i tre pezzi che mi interessavano.

C’è un blocco da 7F4E3161D000, che è readable ed executable ma non writable (p ha semplicemente a che fare con il modo del mapping lì sopra), dove c’è una sequenza di 3538 byte che corrisponde all’eseguibile che stavo provando, home/user/testmem.

C’è un’altra area che è l’area dello heap, c’è un’altra area, un po’ più in su, che è l’area dello stack, e c’è un’altra area che in questo caso è usata da un driver, un virtual driver del sistema operativo, e così via.

Quindi avete la possibilità di andare a vedere, notate che lo spazio andrebbe da 0 a FFFFFFFF, ma solo dei pezzettini piccoli sono usati, tutto il resto è inaccessibile.