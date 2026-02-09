// Annotations class
import { annotate } from 'rough-notation';

export class Annotations {
    constructor(element) {
        this.element = element;
        
        this.elements();
        this.init();
        console.log("annotations");
        
    }
    
    elements() {
        // Initialize elements here
    }

    init() {
        const annotationType = this.element.dataset.annotation;
        const annotationColor = this.element.dataset.annotation_color ? this.element.dataset.annotation_color : "#2C2B32";
        const annotationThickness = this.element.dataset.annotation_thickness ? parseFloat(this.element.dataset.annotation_thickness) : 1;
        const annotationPadding = this.element.dataset.annotation_padding ? parseFloat(this.element.dataset.annotation_padding) : 5;
        const bracketsDirections = this.element.dataset.brackets_directions ? this.element.dataset.brackets_directions.split(",").map(item => item.trim()) : ["top"];
        this.repeat = this.element.dataset.annotation_repeat === "" ? true : false;
        
        let annotationConfig = {
            color: annotationColor,
            strokeWidth: annotationThickness,
            iterations: 5,
            padding: annotationPadding
        };

        switch (annotationType) {
            case "underline":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "underline" });
                break;
            case "circle":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "circle" });
                break;
            case "box":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "box" });
                break;
            case "highlight":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "highlight" });
                break;
            case "bracket":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "bracket", brackets: bracketsDirections });
                break;
            case "strikethrough":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "strike-through" });
                break;
            case "crossed-off":
                this.annotation = annotate(this.element, { ...annotationConfig, type: "crossed-off" });
                break;
        }

        // Set up IntersectionObserver
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target._annotationInstance.annotation.show();

                    if (!entry.target._annotationInstance.repeat) {
                        this.observer.unobserve(entry.target);
                    }
                } else {
                    if (entry.target._annotationInstance.repeat) {
                        entry.target._annotationInstance.annotation.hide();
                    }
                }
            });
        }, {
            threshold: 0.3
        });

        // Store instance reference on element
        this.element._annotationInstance = this;
        
        // Start observing
        this.observer.observe(this.element);
    }
}