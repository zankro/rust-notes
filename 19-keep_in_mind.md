# 📝 Things to keep in mind

>💡 **Costruttore variabili globali**
>
>In C++, se ho costruito delle variabili globali di tipo classe, queste possono avere un costruttore.
>Il costruttore delle variabili globali viene invocato prima che il main parta.
>Il distruttore delle variabili globali viene invocato dopo che il main è terminato.

> 💡 **Puntatori e possesso + Smart Pointers**
> 
> - `&` → Puntatore in sola lettura, senza possesso.
> - `&mut` → Puntatore con accesso in scrittura, senza possesso.
> - `Box<T>` → Puntatore che **possiede** il dato.
>     - Non può essere copiato
>     - Può essere *mosso*
> - `Rc<T>` → **Accesso condiviso (immutabile)** al dato (&T)
>     - **La proprietà è condivisa**
>     - Il dato è posseduto collettivamente da tutti gli `Rc` che lo puntano
>     - Contatori **strong** e **weak** → Utile per strutture cicliche
>     - Il blocco `dato+contatori` sta sullo heap
> - `Arc<T>` → Equivalente **thread-safe** di `Rc<T>`
>     - Accesso **immutabile (&T)** condiviso tra più thread
>     - Usa **atomic increment e decrement**
>     - Usato con `Mutex<T>` o `RwLock<T>` per la mutabilità
> - `Cell<T>` → Contenitore con interior mutability per tipi Copy
>     - Permette di **modificare il dato anche da un riferimento immutabile**
>     - Il contenuto può essere **letto solo per copia** (Copy), **non per reference**
> - `RefCell<T>` → Contenitore con *interior mutability* per **tipi non Copy**
>     - Permette accesso **in lettura (`borrow()`)** e **scrittura (`borrow_mut()`)** anche da `&self`
>     - Verifica le regole di borrowing **a runtime** (panic se violate)
>     - Utile per dati mutabili condivisi in ambienti **single-threaded**
> - `Mutex<T>` → **Protegge un dato con un lock esclusivo per accesso concorrente**
>     - Solo un thread per volta può accedere in scrittura (via `.lock()`)
>     - Interior mutability
>     - Tipicamente usato con `Arc<T>` per **mutabilità condivisa tra thread**
> - `Cow<'a, B>` → *“Clone-On-Write”* → wrapper che può essere **borrowed o owned**
>     - Se non mutato si comporta come `&’a B`
>     - Se mutato effettua un **clone** del dato
>     - Esempio: `Cow<str>` può contenere `&’a str` oppure `String`

> 💡 **Riferimenti, espressioni e valori immediati**
> 
>Scrivere `let r1 = &75` è assolutamente lecito: Rust scrive 75 dentro lo stack, come se avessimo creato una variabile temporanea, prende l’indirizzo di quella variabile e lo salva dentro `r1` e ci lascia fare delle cose.
> 
> Posso scrivere anche `let r1 = &(i*5/4)` — calcola il risultato, lo mette in un temporaneo sempre sullo stack, prende il puntatore e mi manda avanti. 

> 💡 **Modificare l’area puntata dai puntatori**
> 
> In Rust, generalmente questo non è possibile.
> L’unico modo per modificare manualmente un puntatore, per cambiare manualmente l’indirizzo cui sta puntando (tipo con aritmetica dei puntatori), è usare i raw pointers (i puntatori nativi del C) in blocchi unsafe.
> 
> ```rust
> fn main() {
>     // Create an array of i32 values
>     let arr = [1, 2, 3, 4, 5];
> 
>     // Create a raw pointer to the first element of the array
>     let mut r_ptr: *const i32 = arr.as_ptr();
> 
>     // Print the initial value pointed to by r_ptr
>     println!("Initial value: {} @ {:p}", unsafe { *r_ptr }, r_ptr); // Output: Initial value: 1
> 
>     // Perform pointer arithmetic to move the pointer to the next element
>     unsafe {
>         r_ptr = r_ptr.add(1);
>     }
> 
>     // Print the new value pointed to by r_ptr
>     println!("New value: {} @ {:p}", unsafe { *r_ptr }, r_ptr); // Output: New value: 2
> 
>     // Perform pointer arithmetic to move the pointer to the third element
>     unsafe {
>         r_ptr = r_ptr.add(1);
>     }
> 
>     // Print the new value pointed to by r_ptr
>     println!("New value: {} @ {:p}", unsafe { *r_ptr }, r_ptr); // Output: New value: 3
> }
> 
> /*  
> 		OUTPUT:
> 		Initial value: 1 @ 0x7fffbb6b8fa4
> 		New value: 2 @ 0x7fffbb6b8fa8
> 		New value: 3 @ 0x7fffbb6b8fac
> */
> 
> ```

> 💡 **Le struct stanno sullo stack, SEMPRE (a meno che non sono boxate)**
> 
> ![image.png](images/images/keep_in_mind/image.png)
> 
> ![image.png](images/keep_in_mind/image%201.png)

> 💡 **Struct sullo stack vs struct sullo heap (Box<Struct>)**
> 
> ![image.png](images/keep_in_mind/image%202.png)
> 
> ![image.png](images/keep_in_mind/image%203.png)
> 
> ![image.png](images/keep_in_mind/image%204.png)

> 💡 **Copia vs Movimento**
> 
> La **copia** è una **duplicazione**: il nuovo valore è indipendente dall’originale.
> Tipi come gli interi (i32, u8, ecc.) vengono copiati quando vengono assegnati o passati a una funzione: si crea una nuova copia del dato, e l’originale resta valido.
> 
> Invece, per tipi come Box<T>, l’assegnazione comporta un ***movimento*** (move): il valore viene *spostato*, e l’originale non può più essere usato.
> 
> ```rust
> /* This is fine: */
> /* i32 implements Copy */
> fn main() {
>     let x1 = 5;
>     let x2 = x1; // Copy
>     
>     println!("x1: {}", x1);
>     println!("x2: {}", x2);
> }
> ```
> 
> ```rust
> /* This doesn't compile */
> /* Box doesn't implement Copy */
> fn main() {
>     let b1 = Box::new(5);
>     let b2 = b1; // Movement
>     
>     println!("b1: {}", b1);     // this should thrown an error
>     println!("b2: {}", b2);
> }
> ```
> 
> L’esempio a destra non funziona perchè, dato che i dati posseduti da `b1` vengono *spostati* in `b2` (che ne diventa il nuovo proprietario), quando proviamo a stampare `b1` dopo il movimento, il compilatore ci blocca. 
> Ci suggerisce anche un modo per risolvere, qualora proprio volessimo tenere sia `b1` che `b2`: clonare `b1`.
> 
> ```rust
> /* This is fine */
> fn main() {
>     let b1 = Box::new(5);
>     let b2 = b1.clone();
>     
>     println!("b1: {}", b1);
>     println!("b2: {}", b2);
> }
> ```

> 💡 **Copy vs Clone — Part 1**
> 
> ![image.png](images/keep_in_mind/image%205.png)
> 
> ```rust
> fn main() {
>     let vec1 = vec![1, 2, 3];
>     let vec2 = vec1.clone();    // vec2 is a deep copy of vec1
>     let vec3 = vec2;            // vec2 data is moved to vec3
>     
>     println!("{:?}", vec1);     // OK
>     println!("{:?}", vec2);     // ERROR!!!
> }
> ```
> 
> Nell’esempio sopra, vediamo che possiamo clonare o spostare un Vec, ma non possiamo semplicemente copiarlo.
> Questo è vero per Vec, ma anche per qualsiasi tipo complesso come ad esempio delle struct custom con campi complessi all’interno, e in generale per tutti quei tipi che necessitano di una gestione della memoria dinamica, e che dunque devono implementare il tratto `Drop`.

> 💡 **Copy vs Clone — Part 2**
> 
> ![image.png](images/keep_in_mind/image%206.png)
> 
> ![image.png](images/keep_in_mind/image%207.png)

> 💡 **Mutabilità**
> 
> La mutabilità è una caratteristica del *possessore*, non del *dato*.
> Dunque se ad esempio avessi una funzione che crea un Box, e inizialmente questo è immutabile, e poi restituisco questo Box al chiamante, che lo memorizza in una variabile, questa sarebbe il nuovo possessore del Box, che può quindi decidere di mutarlo.
> 
> ```rust
> /* This is fine */
> fn makeBox(a: i32) -> Box<(i32, i32)> {
>     let r = Box::new( (a, 1) );
>     return r;
> }
> 
> fn main() {
>     let mut b = makeBox(5); // OK
>     b.0 = b.0 + 1;
>     
>     println!("{:?}", b);
> }
> ```

> 💡 **Movimento, stack ed heap**
> 
> Il movimento provoca una copia bit a bit di ciò che c’è sullo stack.
> Quello che sta sullo heap non è coinvolto nell’operazione di movimento.
> 
> ![image.png](images/keep_in_mind/image%208.png)
> 
> Ad esempio, supponiamo si avere un `Vec` che punta sullo heap a quella sequenza di interi. Se scrivessi `let v2 = v;`, sullo stack si creerebbe `v2`, cioè un nuovo `Vec`, al cui interno troveremmo: nel primo campo **lo stesso puntatore** alla sequenza di interi, nel secondo campo **la stessa capacity 8**, e nel terzo campo **la stessa size 5**.
> 
> A questo punto il Vec originale `v` **è ancora presente sullo stack**, ma è ora inaccessibile: ha perso diritti e doveri sullo spazio allocato sull’heap.
> 
> Una volta usciti dallo scope sintattico, sia `v` che `v2` verranno egettate dallo stack, ma con una importante differenza: `v2` si occuperà di rilasciare lo spazio sull’heap, mentre `v` non deve fare niente (questo meccanismo — il fatto che v2 deve rilasciare, mentre v no — lo gestisce il compilatore).

> 💡 **Valori temporanei e riferimenti**
> 
> ![image.png](images/keep_in_mind/image%209.png)
> 
> ![image.png](images/keep_in_mind/image%2010.png)

> 💡 **Spostare un puntatore in Rust**
> 
> ![image.png](images/keep_in_mind/image%2011.png)
> 
> ![image.png](images/keep_in_mind/image%2012.png)
> 
> ![image.png](images/keep_in_mind/image%2013.png)
> 
> ![image.png](images/keep_in_mind/image%2014.png)
> 
> ![image.png](images/keep_in_mind/image%2015.png)
> 
> ![image.png](images/keep_in_mind/image%2016.png)
> 
> ![image.png](images/keep_in_mind/image%2017.png)

> 💡 **I riferimenti implementano Copy**
> 
> ![image.png](images/keep_in_mind/image%2018.png)
> 
> Output:
> 
> ![image.png](images/keep_in_mind/image%2019.png)
> 
> Vediamo che `pt1` e `pt2` sono due puntatori distinti: puntano allo stesso indirizzo di memoria (l’indirizzo dove è contenuto `x`), ma hanno indirizzi diversi. Dunque nel momento in cui abbiamo fatto `let pt2 = pt1`, abbiamo creato un nuovo reference ex novo, senza movimento.

> 💡 **Rc — downgrade & upgrade**
> 
> ![image.png](images/keep_in_mind/image%2020.png)
> 
> ![image.png](images/keep_in_mind/image%2021.png)
> 
> ![image.png](images/keep_in_mind/image%2022.png)

> 💡 **Cell<T>**
> 
> ![image.png](images/keep_in_mind/image%2023.png)
> 
> ![image.png](images/keep_in_mind/image%2024.png)

> 💡 **Polimorfismo: *tipi generici* vs *oggetti tratto***
> 
> ![image.png](images/keep_in_mind/image%2025.png)
> 
> **Tipi generici e Monomorfizzazione**
> Quando scriviamo del codice con tipi generici, al momento della compilazione Rust applica un processo di ***monomorfizzazione***: una volta che il compilatore comprende qual è il tipo concreto su cui deve eseguire il codice scritto con le metavariabili, genera il codice ottimizzato per quel tipo concreto. Quindi, se ad esempio abbiamo scritto una funzione con parametri generici, e poi la richiamiamo una volta su degli interi, e una volta su delle stringhe, a compile time verranno generate due versioni della stessa funzione: una ottimizzata per gli interi, l’altra ottimizzata per le stringhe.
> 
> In ogni caso, è possibile applicare dei vincoli su quali possano essere questi tipi concreti che andranno a sostituirsi alle metavariabili, specificando su queste quali sono i tratti che il tipo concreto deve implementare (***Trait Bound***).
> 
> Ad esempio `struct MyStruct<T: Copy> {copy_data: T, ... }` indica che questa struct accetta tra i suoi campi una variabile generica `copy_data`, il cui tipo deve implementare il tratto `Copy`.
> 
> - **Vantaggi**:
>     - Performance a runtime
>     - Ottimizzazione del codice generato per la funzione
>     - *Code inlining* per limitare l’impatto delle chiamate a funzione
>     - Consente di esprimere vincoli più complessi sui tratti
> - **Svantaggi**: codice generato dal compilatore di dimensioni maggiori (di fatto generiamo una versione della stessa funzione per ogni tipo concreto su cui la invochiamo).
> 
> **Oggetti tratto**
> Gli oggetti tratto, d’altro canto, consentono di rimandare a runtime la determinazione della funzione da chiamare, invece di doverla determinare a compile time. Infatti, attraverso la vtable del tipo concreto passato a runtime viene chiamata l’implementazione di quella funzione offerta dal tipo concreto, specificata nella sua vtable.
> Alla funzione viene dunque passato un oggetto tratto: un fat pointer che è composto dal puntatore al dato concreto, e un puntatore alla vtable del tipo concreto.
> 
> - **Vantaggi:**
>     - **Codice più compatto**: quando scriviamo una funzione che usa oggetti tratto, siamo sicuri che il codice della funzione generato dal compilatore è unico, ed è proprio quello lì che abbiamo scritto, a prescindere dal tipo concreto che verrà passato alla funzione
>     - **Un oggetto tratto è un fat pointer, che può puntare a dati di tipo diverso**, e dunque di dimensione diversa. Però alla funzione/struttura passiamo sempre e solo un fat pointer da 16 byte (per architettura 64bit).
>     - **Utile quando dobbiamo memorizzare in una collezione** **tipi diversi**, ma che implementano un tratto comune. 
>     Questo viene facile perchè appunto memorizziamo semplicemente dei riferimenti a degli oggetti che implementano quel tratto lì, mentre nella programmazione generica avremmo dovuto usare una metavariabile `T: Some_trait`, che avrebbe implicato che ***tutti*** gli oggetti della collezione devono essere dello stesso tipo `T`
> - **Svantaggi:**
>     - Non tutti i tratti permettono di definire oggetti tratto (occorre che nessun metodo del tratto non si usi `self` come parametro o tipo di ritorno, ma solo `&self` e `&mut self`)
>     - Non è possibile definire un oggetto tratto legato a più tratti disgiunti (invece con i tipi generici possiamo vincolarli a più tratti!)
>     - Chiamata del metodo più dispendiosa e lenta: passa attaverso la vtable

> 💡 **Puntatori e gestione della memoria in Rust**
> 
> I puntatori consentono di fare tantissime cose, ad esempio quando dobbiamo passare una struttura dati ad una funzione, possiamo passare un puntatore alla struttura, piuttosto che copiare la struttura intera. In pratica, ci dà un modo efficiente per avere dei riferimenti a dei dati.
> 
> Tuttavia, un uso sbagliato dei puntatori (in linguaggi che ne consentono la manipolazione senza espliciti meccanismi che ne rendano sicuro l’utilizzo) può portare a dei comportamenti indesiderati: gli undefined behaviours.
> 
> Tra questi troviamo:
> 
> - **Wild pointer**
> Se non inizializziamo un puntatore con un indirizzo valido, ma piuttosto lo usiamo così com’è, potremmo leggere o scrivere in un indirizzo qualsiasi: dipende da cosa c’era scritto nello stack al momento in cui abbiamo dichiarato il puntatore, senza inizializzarlo.
> - **Dangling pointer**
> Puntatore che punta ad una zona di memoria che però era stata rilasciata: ad esempio l’indirizzo di una variabile uscita di scope. Il puntatore dunque non è più valido, perchè la variabile è stata rilasciata, l’informazione quindi non è più valida e la zona puntata ora potrebbe contenere qualsiasi altra cosa.
> - **Memory leakage**
> Se acquisiamo della memoria dinamica, e otteniamo il puntatore al blocco di memoria dinamica, ma poi non lo rilasciamo più, nel momento in cui il puntatore esce di scope non solo non avremo rilasciato la memoria, ma perderemo anche l’informazione di *dove* era quel blocco di memoria acquisito.
> In pratica, quel blocco non può essere rilasciato: abbiamo creato un buco nella memoria.
> - **Double free**
> Se abbiamo ad esempio due puntatori che puntano allo stesso blocco di memoria, e proviamo a fare un doppio rilascio, provochiamo danni nelle strutture dati che mantengono l’organizzazione della memoria.
> 
> Inoltre, in linguaggi come C i puntatori non hanno informazioni che rendano esplicito se chi li usa è anche responsabile del rilascio della memoria puntata: insomma, il possesso del dato puntato non è chiaro.
> 
> Per risolvere questi problemi, Rust combina due cose: da un lato l’utilizzo di svariati tipi di puntatori, ciascuno con un determinato scopo e determinate caratteristiche (abbiamo puntatori che posseggono, puntatori che non posseggono, puntatori che possono solo leggere, oppure puntatori che possono leggere e scrivere ma nel frattempo non possono esserci altri riferimenti allo stesso dato, oppure ancora puntatori che consentono un possesso condiviso, tenendo all’interno del puntatore stesso le informazioni di in quanti conoscono quel dato etc…), dall’altro l’utilizzo di un modulo del compilatore chiamato **Borrow Checker**, che facendo un’analisi formale e logica del codice garantisce che non esista alcuna possibilità che le regole sul possesso e sui prestiti siano violate.
> 
> Rust implementa il paradigma RAII: *Resource Acquisition Is Initialization*, che in pratica stabilisce che chi acquisisce un dato diventa responsabile della sua inizializzazione, e anche della sua distruzione (e quindi del rilascio di memoria dinamica, laddove previsto).
> In pratica, il dato è posseduto da una e una sola variabile, e quando ad esempio proviamo ad assegnare una variabile ad un’altra solo due sono le possibilità: 
> 
> - Il dato viene ***moss*o** nella nuova variabile, e quella vecchia diventa inaccessibile
> - Il dato viene ***copiato***, generando una copia totalmente separata dal dato originale
> 
> Oppure, il dato può essere ***clonato*** (se non può essere copiato, ma solo mosso), ma questa operazione deve essere resa esplicita dal programmatore.
> 
> Quando la variabile che possiede il dato arriva alla fine del suo ciclo di vita, questa dovrà occuparsi del rilascio del dato posseduto: in Rust questo viene fatto attraverso l’implementazione del tratto `Drop`, infatti i tipi di dati che necessitano particolari operazioni di rilascio (rilascio di blocco di memoria, chiusura di un file, chiusura di un socket etc…) devono implementare questo tratto.

> 💡 **Borrow Checker**
> 
> Il **Borrow Checker** è uno dei meccanismi centrali del compilatore Rust, e ha il compito di **verificare che il codice rispetti le regole di possesso (ownership) e prestito (borrowing)** dei dati. Questo sistema consente di scrivere **codice sicuro in modo automatico, senza bisogno di garbage collector o analisi a runtime**.
> 
> Il Borrow Checker analizza il codice **durante la compilazione** per assicurarsi che:
> 
> - **Ogni valore abbia un solo proprietario (owner)**, che è responsabile della sua validità e distruzione.
> Controlla chi è che possiede un certo dato, se, quando e a chi questo venga ceduto, rendendo impossibile l’accesso alla variabile che lo deteneva in origine etc…
> - **Esistano regole chiare per il “prestito” del dato**:
>     - È possibile avere **più prestiti immutabili** (&T) **oppure uno solo mutabile** (&mut T), **mai entrambi contemporaneamente**.
>     - Un riferimento (prestito) **non può sopravvivere più a lungo del dato originale**.#
> 
> *Perchè è utile?*
> Con il Borrow Checker, Rust **garantisce a compile-time** che non esisterà mai un riferimento non valido. Questo:
> 
> - Elimina la necessità di una raccolta automatica della memoria (GC),
> - Garantisce sicurezza nella concorrenza (thread-safe by default),
> - Migliora le performance, perché evita runtime overhead.
