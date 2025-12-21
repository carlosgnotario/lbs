// FaqElements class
export class FaqElements {
    constructor(element) {
        this.element = element;
        this.open = false;

        this.elements();
        this.bind();        
    }

    elements() {
        
    }

    bind() {
        this.element.addEventListener("click", () => {
            this.toggle();
        });
    }

    toggle() {
        this.open = !this.open;
        if (this.open) {
            this.element.classList.add("active");
        } else {
            this.element.classList.remove("active");
        }
    }
}

