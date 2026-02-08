// ShrinkText class
export class ShrinkText {
    constructor(element) {
        this.element = element;
        this.sizing();
    }

    sizing() {
        let newFontSize = 18 / 16;
        console.log(this.element);
        this.ticking = true;
        
        
        
        this.ticker = () => {            
            const containerHeight = this.element.clientHeight;
            const scrollHeight = this.element.scrollHeight;            

            if (scrollHeight > containerHeight) {                
                newFontSize = newFontSize - 0.01;
                this.element.style.fontSize = `${newFontSize}rem`;
                console.log(scrollHeight, containerHeight);
            } else {
                console.log("removed");
                this.ticking = false;
                gsap.ticker.remove(this.ticker);
            }
        }
        gsap.ticker.add(this.ticker);

        window.addEventListener("resize", () => {
            if (!this.ticking) {
                this.element.style.fontSize = "1rem";
                gsap.ticker.add(this.ticker);
            }
        });
    }
}

