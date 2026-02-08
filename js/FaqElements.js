// FaqElements class
export class FaqElements {
    constructor(element) {
        this.element = element;
        this.elements();
        this.bind();        
    }

    elements() {
        this.items = this.element.querySelectorAll(".faq-item");
    }

    bind() {
        this.items.forEach(item => {
            item.open = false;

            item.addEventListener("click", () => {
                this.toggle(item);
                console.log("clicked", item);        
            });
        });
    }

    toggle(item) {
        if (!item.open) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
        item.open = !item.open;
    }
}

