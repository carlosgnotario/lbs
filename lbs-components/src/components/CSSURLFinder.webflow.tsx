import { CSSURLFinder } from './CSSURLFinder';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

const CSSURLFinderComponent = declareComponent(CSSURLFinder, {
    name: 'CSS Loader',
    description: 'Loads App.css at head level (auto-detects URL) with toggle for custom URL',
    group: 'Utilities',
});

export default CSSURLFinderComponent;

