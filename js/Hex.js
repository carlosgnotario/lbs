// Hex class
import gsap from "gsap";

export class Hex {
    constructor(element) {
        this.element = element;
        this.hexQ = 32;
        
        this.elements();
        this.build();
        this.place();
        this.sizing();
        this.animate();

        window.addEventListener("resize", this.sizing.bind(this));
    }

    elements() {
        // Create a bg div
        this.bg = document.createElement("div");
        this.bgWrapper = document.createElement("div");
        this.bgWrapper.classList.add("bg-wrapper");
        this.bg.classList.add("bg");
        this.element.appendChild(this.bgWrapper);
        this.bgWrapper.appendChild(this.bg);
    }

    build() {
        for (let i = 0; i < this.hexQ; i++) {
            const hex = document.createElement("div");
            hex.classList.add("hex");
            this.bg.appendChild(hex);
        }
        this.hexes = this.bg.querySelectorAll(".hex");
    }

    place() {
        const bgColor = getComputedStyle(this.hexes[0]).backgroundColor;
        const rgb = bgColor.match(/\d+/g).map(Number);

        this.hexes.forEach((hex, index) => {
            const col = index % 8;
            const row = Math.floor(index / 8);
            const rVar = Math.random() * 10;
            const gVar = Math.random() * 140 - 30;
            const bVar = Math.random() * 10;

            gsap.set(hex, {
                xPercent: col * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4),
                yPercent: row * 75,
                backgroundColor: `rgb(${Math.max(0, Math.min(255, rgb[0] + rVar))}, ${Math.max(0, Math.min(255, rgb[1] + gVar))}, ${Math.max(0, Math.min(255, rgb[2] + bVar))})`
            });
        });
    }

    sizing() {
        gsap.set(this.hexes, {
            width: this.bgWrapper.offsetHeight / 2,
        })
        gsap.set(this.bg, {
            height: this.hexes[0].getBoundingClientRect().height + (this.hexes[0].getBoundingClientRect().height * 3 * 0.75),
            width: this.hexes[0].getBoundingClientRect().width * 8 * 0.866,
        })
    }

    animate() {
        const tl = gsap.timeline();
        tl.from(this.hexes, {
            opacity: 0,
            scale: 0.7,
            duration: 2,
            ease: "elastic.out(1, 0.3)",
            stagger: {
                grid: 'auto',
                from: "center",
                each: 0.05,
                onComplete: function () {
                    gsap.to(this._targets[0], {
                        opacity: 0,
                        yoyo: true,
                        duration: "random(0.5, 5)",
                        delay: "random(0, 2)",
                        repeat: -1,
                    })
                    
                }
            },
            delay: 2
        })
        tl.to(this.hexes, {
            opacity: 0,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            duration: "random(0.5, 5)",
            delay: "random(0, 2)"
        })
    }
}

