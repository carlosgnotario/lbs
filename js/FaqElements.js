// FaqElements class
export class FaqElements {
    constructor(element) {
        this.element = element;
        this.open = false;

        this.elements();
        this.bind();        
    }

    elements() {
        this.items = this.element.querySelectorAll(".faq-item");
    }

    bind() {
        this.items.forEach(item => {
            item.addEventListener("click", () => {
                this.toggle(item);
            });
        });
    }

    toggle(item) {
        this.open = !this.open;
        if (this.open) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    }
}

