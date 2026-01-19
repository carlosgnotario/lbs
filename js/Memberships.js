// Memberships class
import gsap from "gsap";
export class Memberships {
    constructor(element) {
        this.element = element;
        this.currentTab = null;
        
        this.elements();
        this.bind();
        this.showTab(0);
    }

    elements() {
        this.togglerLinks = this.element.querySelectorAll(".memberships-toggler div:not(.memberships-indicator");
        this.tabs = this.element.querySelectorAll(".memberships-tab");
        this.tabs.forEach(tab => {
            tab.items = tab.querySelectorAll(".membership-plan");
            tab.items.forEach(item => {
                item.numeral = item.querySelector(".membership-pricing-number");
            });
        });
        console.log(this.togglerLinks);
        
    }

    bind() {
        this.togglerLinks.forEach((item, index) => {
            item.addEventListener("click", () => {
                if (this.currentTab === index) return;
                this.showTab(index);
            });
        });
    }

    showTab(index) {
        const currentTab = this.tabs[index];
        const left = index > this.currentTab ? true : false;

        if (this.currentTab !== null) {
            const previousTab = this.tabs[this.currentTab];
            gsap.to(previousTab.items, {
                autoAlpha: 0,
                duration: 1,
                ease: "elastic.out(1, 0.7)",
                xPercent: left ? 20 : -20,
                stagger: left ? -0.2 : 0.2
            });
            gsap.set(previousTab, {
                autoAlpha: 0,
                duration: 1,
                delay: 1
            });
        }

        gsap.to(currentTab, {
            autoAlpha: 1,
            duration: 1,
            ease: "power4.inOut"
        });
        gsap.fromTo(currentTab.items, {
            autoAlpha: 0,
            xPercent: left ? -20 : 20,
        }, {
            autoAlpha: 1,
            xPercent: 0,
            duration: 1,
            ease: "elastic.out(1, 0.7)",
            stagger: left ? -0.2 : 0.2,
            delay: 0.5
        });
        currentTab.items.forEach(item => {
            gsap.from(item.numeral, {
                textContent: 0,
                snap: { textContent: 1 },
                duration: 2,
                ease: "power2.out",
                delay: 0.5
            });
        });
        
        this.currentTab = index;
    }
}
