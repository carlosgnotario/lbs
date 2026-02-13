// MovingHex class
export class MovingHex {
    constructor(element) {
        this.element = element;
        this.slot = this.element.querySelector(".slot");

        this.create();
        this.position();
        this.animate();
    }

    create() {
        const hexQ = 48;
        this.hexWrapper = [document.createElement("div"), document.createElement("div")];
        this.hexWrapper.forEach(wrapper => {
            wrapper.classList.add("hex-wrapper");
            if (this.slot) {
                this.slot.appendChild(wrapper);
                gsap.set(this.slot, { position: "relative", })
            } else {
                this.element.appendChild(wrapper);
            }
        });
        gsap.set(this.hexWrapper[1], {
            scaleX: -1,
            y: "-6rem",
        });
        for (let i = 0; i < hexQ; i++) {
            // Wrap the hexes in a div with the class hex-controller
            const hexController = document.createElement("div");
            hexController.classList.add("hex-controller");
            const hex = document.createElement("div");
            hex.classList.add("hex");
            hexController.appendChild(hex);
            if (i < 24) {
                this.hexWrapper[0].appendChild(hexController);
            } else {
                this.hexWrapper[1].appendChild(hexController);
            }
        }
        this.hexWrapper.forEach(wrapper => {
            wrapper.controllers = wrapper.querySelectorAll(".hex-controller");
        });
    }

    position() {
        this.hexWrapper.forEach(wrapper => {
            wrapper.controllers.forEach((controller, index) => {
                const col = index % 4;
                const row = Math.floor(index / 4);
                gsap.set(controller, {
                    xPercent: ((col - 1) * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4)) * 1.1,
                    yPercent: (row * 75) * 1.1,
                });
            });
        });
    }

    animate() {
        // every 4 hexes animate them
        this.hexWrapper.forEach(wrapper => {
            wrapper.controllers.forEach((controller, index) => {
                const hex = controller.querySelector(".hex");
                const duration = 3;
                gsap.to(hex, {
                    xPercent: (93.3 - 6.7) * 1.09,
                    ease: "none",
                    duration: duration,
                    repeat: -1
                })
                // target % 4 === 0
                if (index % 4 === 0) {
                    gsap.from(hex, {
                        autoAlpha: 0,
                        rotate: -180,
                        duration: duration - 1,
                        ease: "elastic.out(1, 0.9)",
                        repeat: -1,
                        scale: 0.5,
                        repeatDelay: duration - 2
                    });
                }
                // target 4 1
                if (index % 4 === 1) {
                    gsap.to(hex, {
                        scale: 0.8,
                        duration: duration,
                        ease: "none",
                        repeat: -1,
                    });
                }
                // target 4 3
                if (index % 4 === 2) {
                    gsap.fromTo(hex, {
                        scale: 0.8,
                    }, {
                        duration: duration,
                        ease: "none",
                        repeat: -1,
                        scale: 0.6,
                    });
                }
                // target 4 4
                if (index % 4 === 3) {
                    gsap.fromTo(hex, {
                        autoAlpha: 1,
                        scale: 0.6
                    }, {
                        autoAlpha: 0,
                        duration: duration,
                        ease: "none",
                        repeat: -1,
                        scale: 0.5,
                        rotate: 180
                    });
                }
            });
        });
    }
}

