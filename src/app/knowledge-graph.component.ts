import { Component, OnInit, OnDestroy, ElementRef, ViewChild, effect } from '@angular/core';
import { DynamicComponent } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';
import cytoscape from 'cytoscape';


interface KnowledgeGraphProperties {
    [k: string]: any;
    data: any;
    layout?: string;
    title?: string;
}

interface KnowledgeGraphNode extends Types.CustomNode {
    type: 'KnowledgeGraph';
    properties: KnowledgeGraphProperties;
}

@Component({
    selector: 'app-knowledge-graph',
    standalone: true,
    template: `
    <div class="kg-container">
      @if (title) {
        <h3>{{ title }}</h3>
      }
      <div #graphContainer class="graph-surface"></div>
    </div>
  `,
    styles: [`
    .kg-container {
      width: 100%;
      height: 500px;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      box-sizing: border-box;
    }
    
    h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #333;
    }

    .graph-surface {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: #f8f9fa;
      border-radius: 4px;
    }
  `]
})
export class KnowledgeGraphComponent extends DynamicComponent<KnowledgeGraphNode> implements OnInit, OnDestroy {
    @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;

    private cy?: cytoscape.Core;
    protected title = '';

    constructor() {
        console.log('🔵 KG - Constructor START');
        super();
    }

    ngOnInit() {
        console.log('🟢 KG - ngOnInit');
        this.createGraph();
    }

    ngOnDestroy() {
        if (this.cy) {
            this.cy.destroy();
        }
    }

    private updateGraph() {
        if (this.cy) {
            this.cy.destroy();
            this.cy = undefined;
        }
        this.createGraph();
    }

    private createGraph() {
        if (!this.graphContainer?.nativeElement) return;

        const comp = this.component();
        if (!comp || comp.type !== 'KnowledgeGraph') return;

        const props = comp.properties;
        this.title = props.title || '';
        console.log('📊 Creating graph:', this.title);

        let elements: any[] = [];
        try {
            const resolvedData = this.resolveData(props.data);
            if (resolvedData) {
                elements = this.processGraphData(resolvedData);
                console.log('✅ Elements:', elements.length);
            }
        } catch (err) {
            console.error('🔴 Data error:', err);
            return;
        }

        const layoutName = props.layout || 'grid';

        this.cy = cytoscape({
            container: this.graphContainer.nativeElement,
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(label)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '12px',
                        'width': '60px',
                        'height': '60px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '10px'
                    }
                }
            ],
            layout: { name: layoutName } as any
        });

        setTimeout(() => {
            if (this.cy) {
                this.cy.layout({ name: layoutName, fit: true, padding: 30 } as any).run();
            }
        }, 100);
    }

    private resolveData(data: any): any {
        if (!data) return null;

        if (typeof data === 'object' && 'path' in data) {
            const resolved = this.processor.getData(this.component()!, data.path, this.surfaceId() || '');
            return this.unpackA2uiData(resolved);
        }
        return this.unpackA2uiData(data);
    }

    private unpackA2uiData(data: any): any {
        if (data === null || data === undefined) return null;

        if (data instanceof Map) {
            const obj: any = {};
            data.forEach((value, key) => {
                obj[key] = this.unpackA2uiData(value);
            });
            return obj;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.unpackA2uiData(item));
        }

        if (typeof data === 'object') {
            if (data.valueString !== undefined) return data.valueString;
            if (data.valueNumber !== undefined) return data.valueNumber;
            if (data.valueBoolean !== undefined) return data.valueBoolean;
            if (data.valueArray) return this.unpackA2uiData(data.valueArray);
            if (data.valueMap) return this.unpackA2uiData(data.valueMap);
        }

        return data;
    }

    private processGraphData(data: any): any[] {
        console.log('📊 Processing:', data);
        const elements: any[] = [];

        let items: any[] = [];

        if (Array.isArray(data)) {
            items = data;
        } else if (data && typeof data === 'object') {
            if (data.nodes) items.push(...(Array.isArray(data.nodes) ? data.nodes : []));
            if (data.edges) items.push(...(Array.isArray(data.edges) ? data.edges : []));

            // Convert {0: {...}, 1: {...}} to array
            if (items.length === 0) {
                const keys = Object.keys(data);
                if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
                    console.log('📊 Converting numeric keys to array');
                    items = Object.values(data);
                }
            }
        }

        console.log('📊 Items:', items.length);

        items.forEach((item, index) => {
            if (!item) return;

            if (item.source && item.target) {
                elements.push({
                    data: {
                        id: item.id || `e-${item.source}-${item.target}`,
                        source: item.source,
                        target: item.target,
                        label: item.label || ''
                    }
                });
            } else {
                elements.push({
                    data: {
                        id: item.id || item.name || `n${index}`,
                        label: item.label || item.name || item.id || 'Node'
                    }
                });
            }
        });

        return elements;
    }
}
