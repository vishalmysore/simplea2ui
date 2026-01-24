import { Component, OnInit, OnDestroy, ElementRef, ViewChild, effect } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { DynamicComponent } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';

Chart.register(...registerables);

interface GraphProperties {
  [k: string]: any;
  data: any;
  graphType?: string;
  interactive?: boolean;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  emits?: Array<
    | 'graph.point.selected'
    | 'graph.range.selected'
    | 'graph.dataset.filtered'
  >;
}

interface GraphNode extends Types.CustomNode {
  type: 'Graph';
  properties: GraphProperties;
}

@Component({
  selector: 'app-graph',
  standalone: true,
  template: `
    <div class="graph-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .graph-container {
      width: 100%;
      height: 400px;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
      .graph-container {
        height: 300px;
        padding: 0.5rem;
      }
    }
  `]
})
export class GraphComponent extends DynamicComponent<GraphNode> implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart?: Chart;

  constructor() {
    super();
    
    // React to component changes
    effect(() => {
      const comp = this.component();
      if (comp) {
        this.updateChart();
      }
    });
  }

  ngOnInit() {
    this.createChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private emitSemanticEvent(type: string, payload: any) {
    const surfaceId = this.surfaceId();
    const comp = this.component();

    console.log('GraphComponent – emitting event', { type, payload });

    // For now, we'll create a synthetic userAction event
    // This follows the A2UI pattern of semantic interactions
    const userAction = {
      name: type,
      sourceComponentId: comp?.id,
      surfaceId: surfaceId,
      timestamp: new Date().toISOString(),
      context: payload
    };

    // Emit through the processor's events stream
    // Since MessageProcessor doesn't have emitEvent, we'll use the events subject
    if (this.processor && (this.processor as any).events) {
      (this.processor as any).events.next({
        message: userAction,
        completion: {
          next: () => {},
          complete: () => {},
          error: () => {}
        }
      });
    }
  }

  private updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.createChart();
  }

  private createChart() {
    if (!this.chartCanvas?.nativeElement) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const comp = this.component();
    if (!comp || comp.type !== 'Graph') return;

    const props = comp.properties;
    const surfaceId = this.surfaceId();
    
    console.log('GraphComponent - Creating chart:', {
      componentId: comp.id,
      surfaceId,
      props
    });
    
    // Resolve data: check if it's a path binding or direct data
    let data: any[] = [];
    if (props.data && typeof props.data === 'object' && 'path' in props.data) {
      // Data path binding - resolve through MessageProcessor
      const resolvedData = this.processor.getData(comp, props.data.path, surfaceId || '');
      console.log('GraphComponent - Raw resolved data:', resolvedData);
      
      // Convert v0.8 data format (Map or Array) to regular array
      if (resolvedData instanceof Map) {
        // Map format: Map{'0' => Map{'x' => 'Jan', 'y' => 12500}, '1' => ...}
        data = Array.from(resolvedData.values()).map((innerMap: any) => {
          if (innerMap instanceof Map) {
            const obj: any = {};
            innerMap.forEach((value: any, key: string) => {
              obj[key] = value;
            });
            return obj;
          }
          return innerMap;
        });
      } else if (Array.isArray(resolvedData)) {
        // Array format with valueMap
        data = resolvedData.map((item: any) => {
          if (item.valueMap) {
            const obj: any = {};
            item.valueMap.forEach((pair: any) => {
              obj[pair.key] = pair.valueString ?? pair.valueNumber ?? pair.valueBoolean;
            });
            return obj;
          }
          return item;
        });
      }
      console.log('GraphComponent - Converted data:', data);
    } else {
      // Direct data array
      data = Array.isArray(props.data) ? props.data : [];
      console.log('GraphComponent - Using direct data:', data);
    }
    
    console.log('GraphComponent - Final data array length:', data.length);
    
    const graphType = (props.graphType as ChartType) || 'line';
    const interactive = props.interactive !== false;
    const title = props.title || '';
    const xLabel = props.xLabel || '';
    const yLabel = props.yLabel || '';

    // Parse data format - support both {x, y} and simple arrays
    let labels: any[] = [];
    let values: any[] = [];

    if (data.length > 0) {
      if (typeof data[0] === 'object' && 'x' in data[0] && 'y' in data[0]) {
        // Format: [{x: 1, y: 10}, {x: 2, y: 20}]
        labels = data.map(d => d.x);
        values = data.map(d => d.y);
      } else if (typeof data[0] === 'object' && 'label' in data[0] && 'value' in data[0]) {
        // Format: [{label: 'A', value: 10}, {label: 'B', value: 20}]
        labels = data.map(d => d.label);
        values = data.map(d => d.value);
      } else {
        // Simple array: [10, 20, 30]
        labels = data.map((_, i) => i + 1);
        values = data;
      }
    }

    console.log('GraphComponent - Chart data:', { labels, values, graphType, title });

    const config: ChartConfiguration = {
      type: graphType,
      data: {
        labels: labels,
        datasets: [{
          label: title || 'Data',
          data: values,
          backgroundColor: [
            'rgba(102, 126, 234, 0.5)',
            'rgba(118, 75, 162, 0.5)',
            'rgba(237, 100, 166, 0.5)',
            'rgba(255, 154, 0, 0.5)',
            'rgba(52, 211, 153, 0.5)',
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(118, 75, 162, 1)',
            'rgba(237, 100, 166, 1)',
            'rgba(255, 154, 0, 1)',
            'rgba(52, 211, 153, 1)',
          ],
          borderWidth: 2,
          tension: 0.4, // Smooth lines for line charts
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: interactive ? 'index' : undefined,
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: !!title,
            text: title || '',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            enabled: interactive
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: !!xLabel,
              text: xLabel || ''
            }
          },
          y: {
            display: true,
            title: {
              display: !!yLabel,
              text: yLabel || ''
            },
            beginAtZero: true
          }
        },
        onClick: (event, elements) => {
          // Only emit if component declares it can emit point selection events
          if (!props.emits?.includes('graph.point.selected')) return;
          if (!elements.length) return;

          const element = elements[0];
          const index = element.index;

          const label = labels[index];
          const value = values[index];

          this.emitSemanticEvent('graph.point.selected', {
            label,
            value,
            index,
            graphId: comp.id,
            title
          });
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
