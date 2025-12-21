import gsap from "gsap";
// ShrinkText class
export class ShrinkText {
    constructor(element) {
        this.element = element;
        this.sizing();
    }

    sizing() {
        let newFontSize = 18 / 16;
        
        this.ticker = () => {
            const containerHeight = this.element.clientHeight;
            const scrollHeight = this.element.scrollHeight;

            if (scrollHeight > containerHeight) {
                newFontSize = newFontSize - 0.01;
                this.element.style.fontSize = `${newFontSize}rem`;
            }
        }
        gsap.ticker.add(this.ticker);
    }
}

