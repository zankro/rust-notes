// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="00-introduzione.html"><strong aria-hidden="true">1.</strong> Introduzione</a></li><li class="chapter-item expanded "><a href="01-allocazione_della_memoria_parte_1.html"><strong aria-hidden="true">2.</strong> Allocazione della Memoria (Parte 1)</a></li><li class="chapter-item expanded "><a href="02-allocazione_della_memoria_parte_2.html"><strong aria-hidden="true">3.</strong> Allocazione della Memoria (Parte 2)</a></li><li class="chapter-item expanded "><a href="03-allocazione_della_memoria_parte_3.html"><strong aria-hidden="true">4.</strong> Allocazione della Memoria (Parte 3)</a></li><li class="chapter-item expanded "><a href="04-introduzione_al_linguaggio.html"><strong aria-hidden="true">5.</strong> Introduzione al Linguaggio</a></li><li class="chapter-item expanded "><a href="05-il_linguaggio_parte_1.html"><strong aria-hidden="true">6.</strong> Il Linguaggio (Parte 1)</a></li><li class="chapter-item expanded "><a href="05-il_linguaggio_parte_2.html"><strong aria-hidden="true">7.</strong> Il Linguaggio (Parte 2)</a></li><li class="chapter-item expanded "><a href="06-possesso.html"><strong aria-hidden="true">8.</strong> Possesso</a></li><li class="chapter-item expanded "><a href="07-tipi_composti.html"><strong aria-hidden="true">9.</strong> Tipi Composti</a></li><li class="chapter-item expanded "><a href="08-polimorfismo.html"><strong aria-hidden="true">10.</strong> Polimorfismo</a></li><li class="chapter-item expanded "><a href="09-lifetime.html"><strong aria-hidden="true">11.</strong> Lifetime</a></li><li class="chapter-item expanded "><a href="10-chiusure.html"><strong aria-hidden="true">12.</strong> Chiusure</a></li><li class="chapter-item expanded "><a href="11-gestione_degli_errori.html"><strong aria-hidden="true">13.</strong> Gestione degli Errori</a></li><li class="chapter-item expanded "><a href="12-iteratori.html"><strong aria-hidden="true">14.</strong> Iteratori</a></li><li class="chapter-item expanded "><a href="13-collezioni_di_dati.html"><strong aria-hidden="true">15.</strong> Collezioni di Dati</a></li><li class="chapter-item expanded "><a href="14-file_io.html"><strong aria-hidden="true">16.</strong> File I/O</a></li><li class="chapter-item expanded "><a href="15-smart_pointer.html"><strong aria-hidden="true">17.</strong> Smart Pointer</a></li><li class="chapter-item expanded "><a href="16-concorrenza.html"><strong aria-hidden="true">18.</strong> Concorrenza</a></li><li class="chapter-item expanded "><a href="17-processi_parte_1.html"><strong aria-hidden="true">19.</strong> Processi (Parte 1)</a></li><li class="chapter-item expanded "><a href="18-processi_parte_2.html"><strong aria-hidden="true">20.</strong> Processi (Parte 2)</a></li><li class="chapter-item expanded "><a href="19-keep_in_mind.html"><strong aria-hidden="true">21.</strong> Keep in Mind</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
