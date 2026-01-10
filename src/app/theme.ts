import { Theme } from '@a2ui/angular';    
    
export const theme: Theme = {    
  components: {    
    AudioPlayer: {},  
    Button: { 'layout-pt-2': true, 'color-bgc-p30': true },    
    Card: {},  
    CheckBox: {  
      element: {},  
      label: {},  
      container: {},  
    },  
    Column: {},  
    DateTimeInput: {  
      container: {},  
      label: {},  
      element: {},  
    },  
    Divider: {},  
    Icon: {},  
    Image: {  
      all: {},  
      avatar: {},  
      header: {},  
      icon: {},  
      largeFeature: {},  
      mediumFeature: {},  
      smallFeature: {},  
    },  
    List: {},  
    Modal: {  
      backdrop: {},  
      element: {},  
    },  
    MultipleChoice: {  
      container: {},  
      label: {},  
      element: {},  
    },  
    Row: {},  
    Slider: {  
      container: {},  
      label: {},  
      element: {},  
    },  
    Tabs: {  
      container: {},  
      controls: { all: {}, selected: {} },  
      element: {},  
    },  
    TextField: {   
      container: {},  
      label: {},  
      element: {}  
    },    
    Text: {   
      all: { 'typography-sz-bm': true, 'color-c-n10': true },  
      h1: {},  
      h2: {},  
      h3: {},  
      h4: {},  
      h5: {},  
      body: {},  
      caption: {}  
    },  
    Video: {}  
  },    
  elements: {      
    a: {},                    // Add missing elements  
    audio: {},  
    body: {},  
    button: { 'typography-w-500': true, 'color-bgc-s30': true },      
    h1: {},  
    h2: {},  
    h3: {},  
    h4: {},  
    h5: {},  
    iframe: {},  
    input: { 'typography-f-sf': true, 'border-br-6': true },      
    p: {},  
    pre: {},  
    textarea: {},  
    video: {},  
  },    
  markdown: {  
  p: ['color-c-n60'],  
  h1: ['typography-sz-h1', 'color-c-n90'],  
  h2: ['typography-sz-h2', 'color-c-n90'],  
  h3: ['typography-sz-h3', 'color-c-n90'],  
  h4: ['typography-sz-h4', 'color-c-n90'],  
  h5: ['typography-sz-h5', 'color-c-n90'],  
  ul: [],  
  ol: [],  
  li: [],  
  a: [],  
  strong: [],  
  em: [],  
},    
  additionalStyles: {    
    Card: { 'min-width': '320px' },    
  },    
};