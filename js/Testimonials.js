// Testimonial class
export class Testimonials {
    constructor(element) {
        this.element = element;
        this.wrapper = this.element.querySelector(".testimonials-wrapper");

        // this.create();
        this.elements();
        this.sizing();
        this.bind();
    }

    elements() {
        this.currentBreakpoint = null;
        this.currentPage = null;
        this.testimonials = this.element.querySelectorAll(".testimonial");
        this.next = this.element.querySelector(".testimonials-controls-next");
        this.prev = this.element.querySelector(".testimonials-controls-prev");
        this.indicators = this.element.querySelector(".testimonials-bullets");
    }

    sizing() {
        this.breakpoint = window.innerWidth < 768 ? "mobile" : window.innerWidth < 992 ? "tablet" : "desktop";
        this.itemsPerPage = this.breakpoint === "mobile" ? 1 : this.breakpoint === "tablet" ? 2 : 3;
        this.totalPages = Math.ceil((this.testimonials.length) / this.itemsPerPage);
        this.testimonialWidth = this.testimonials[0].getBoundingClientRect().width;
        this.testimonialGap = parseInt(getComputedStyle(this.wrapper).columnGap);
        
        const changePagesCount = () => {
            this.indicators.innerHTML = "";
            for (let i = 0; i < this.totalPages; i++) {
                const indicator = document.createElement("div");
                console.log("happens");
                
                indicator.classList.add("testimonials-bullet");
                this.indicators.appendChild(indicator);
            }
            this.indicatorsBullets = this.indicators.querySelectorAll(".testimonials-bullet");
            this.indicatorsBullets[0].classList.add("active", "from-left");
        }

        if (this.breakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = this.breakpoint;
            changePagesCount();
            this.update(0);
        }
    }

    create() {
        // Clone this.testimonials[0] 10 times in the HTML
        const testimonialOriginal = this.element.querySelector(".testimonial");
        // this.wrapper.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const testimonial = testimonialOriginal.cloneNode(true);
            this.wrapper.appendChild(testimonial);
        }
    }

    bind() {
        this.next.addEventListener("click", () => {
            if (this.currentPage === this.totalPages - 1) { return; }
            this.update(Math.min(this.totalPages - 1, this.currentPage + 1));
        });
        this.prev.addEventListener("click", () => {
            if (this.currentPage === 0) { return; }
            this.update(Math.max(0, this.currentPage - 1));
        });

        window.addEventListener("resize", () => {
            this.sizing();
        });
    }

    update(newPage) {
        let page = Math.min(this.testimonials.length - this.itemsPerPage, newPage * this.itemsPerPage);
        console.log(page);
        
        this.indicatorsBullets[newPage].classList.add("active", newPage > this.currentPage ? "from-left" : "from-right");
        if (this.currentPage !== null) {
            this.indicatorsBullets[this.currentPage].classList.remove("active", "from-left", "from-right");        
        }
        
        gsap.to(this.testimonials, {
            x: (page * (this.testimonialWidth + this.testimonialGap)) * -1,
            ease: "elastic.out(1, 0.9)",
            duration: 2,
        })

        this.currentPage = newPage;
    }
}

