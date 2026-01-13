// JavaScript Modules
import Lenis from "lenis";
import { Button } from "./Button.js";
import { Roller } from "./Roller.js";
import { Hex } from "./Hex.js";
import { MovingHex } from "./MovingHex.js";
import { Diction } from "./Diction.js";
import { Megamenu } from "./Megamenu.js";
import { Video } from "./Video.js";
import { Parallax } from "./Parallax.js";
import { ShrinkText } from "./ShrinkText.js";
import { Testimonials } from "./Testimonials.js";
import { FaqElements } from "./FaqElements.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        gsap.registerPlugin(ScrollTrigger);
        const g = {}
        window.g = g;

        g.pxToRem = (px) => {
            return ( px / 16 * 1 ) + "rem";
        }

        // Initialize Lenis smooth scroll
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        //stop lenis 
        lenis.stop();

        //reload lenis animations
        $(document).ready(function(){lenis.start();})

        window.lenis = lenis;

        getFontSize();
        window.addEventListener('resize', () => {
            getFontSize();
        });
        // Classes
        const buttonElements = document.querySelectorAll(".button");
        buttonElements.forEach(element => {
            new Button(element);
        });

        const rollerElements = document.querySelectorAll("[data-roller]");
        rollerElements.forEach(element => {
            new Roller(element);
        });

        const hexElements = document.querySelectorAll(".bg-hex");
        hexElements.forEach(element => {
            new Hex(element);
        });

        const shrinkText = document.querySelectorAll("[data-shrink]");
        shrinkText.forEach(element => {
            new ShrinkText(element);
        });

        const testimonialElements = document.querySelectorAll("[testimonial]");
        testimonialElements.forEach(element => {
            new Testimonials(element);
        });

        const faqElements = document.querySelectorAll("[faq]");
        faqElements.forEach(element => {
            new FaqElements(element);
        });

        const movingHexElements = document.querySelectorAll("[moving-hex]");
        movingHexElements.forEach(element => {
            new MovingHex(element);
        });

        const dictionElements = document.querySelectorAll("[diction]");
        dictionElements.forEach(element => {
            new Diction(element);
        });

        const megamenuElements = document.querySelectorAll("[megamenu]");
        megamenuElements.forEach(element => {
            new Megamenu(element);
        });

        const videoModalElements = document.querySelectorAll("[data-video]");
        videoModalElements.forEach(element => {
            new Video(element);
        });

        const parallaxElements = document.querySelectorAll("[data-animation='parallax']");
        parallaxElements.forEach(element => {
            new Parallax(element);
        });
    });
}


function getFontSize() {
    const breakpoint = window.innerWidth < 768 ? "small" : window.innerWidth < 992 ? "medium" : "desktop";
    let fontSize = breakpoint === "small" ?  document.body.clientWidth / 767 * 16 : breakpoint === "medium" ? document.body.clientWidth / 991 * 16 : Math.min(document.body.clientWidth / 1290 * 16, 1680 / 1290 * 16);
    document.documentElement.style.setProperty('--fontSize', fontSize + 'px');
}