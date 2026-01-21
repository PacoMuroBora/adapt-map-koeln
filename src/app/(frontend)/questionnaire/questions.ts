export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  id: string
  key: string
  title: string
  description?: string
  type:
    | 'address'
    | 'select'
    | 'slider'
    | 'radio'
    | 'checkbox'
    | 'text'
    | 'iconSelection'
    | 'group'
  required: boolean
  options?: QuestionOption[]
  sliderConfig?: {
    min: number
    max: number
    step: number
  }
  groupFields?: Question[]
}

export const QUESTIONS: Question[] = [
  {
    id: '1',
    key: 'heatFrequency',
    title: 'Häufigkeit der Hitze',
    description:
      'Wie häufig erleben Sie gefühlte Hitzetage, an welchen es Ihnen signifikant zu heiß ist in Ihrem Teil der Stadt, also zuhause, beim Gassigehen oder einfach auf dem Weg zum Supermarkt?',
    type: 'select',
    required: true,
    options: [
      { value: '1-3', label: '1 – 3 Tage' },
      { value: '4-10', label: '4 – 10 Tage' },
      { value: '11-20', label: '11 – 20 Tage' },
      { value: '21-40', label: '21 – 40 Tage' },
      { value: '>40', label: '> 40 Tage' },
    ],
  },
  {
    id: '2',
    key: 'heatIntensity',
    title: 'Intensität der Hitze',
    description: 'Wie intensiv empfinden Sie die Hitze?',
    type: 'slider',
    required: true,
    sliderConfig: {
      min: 0,
      max: 9,
      step: 1,
    },
  },
  {
    id: '3',
    key: 'livingSituation',
    title: 'Wohnort/Situation kurz beschreiben',
    description:
      'Ermittlung von Urbaner Begrünung, Bebauung, Wohnung/Haus, Einschätzung der Versiegelung',
    type: 'group',
    required: true,
    groupFields: [
      {
        id: '3.1',
        key: 'housingType',
        title: 'Wohnen Sie in einer Wohnung oder Haus?',
        type: 'radio',
        required: true,
        options: [
          { value: 'apartment', label: 'Wohnung' },
          { value: 'house', label: 'Haus' },
        ],
      },
      {
        id: '3.2',
        key: 'greenNeighborhood',
        title:
          'Würden Sie Ihre Nachbarschaft als offen und grün beschreiben?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'no', label: 'Nein' },
          { value: 'unsure', label: 'Weiß nicht' },
        ],
      },
      {
        id: '3.3',
        key: 'cityArea',
        title: 'Wohnen Sie eher in der Innenstadt oder im äußeren Bereich der Stadt?',
        type: 'radio',
        required: true,
        options: [
          { value: 'inner', label: 'Innenstadt' },
          { value: 'outer', label: 'Äußerer Bereich' },
        ],
      },
    ],
  },
  {
    id: '4',
    key: 'climateAdaptationKnowledge',
    title: 'Kurze Abfrage des Wissenstands über Klimawandelanpassung',
    description: 'Können Sie etwas mit dem Begriff Klimawandelanpassung anfangen?',
    type: 'group',
    required: true,
    groupFields: [
      {
        id: '4.1',
        key: 'knowsTerm',
        title: 'Kennen Sie den Begriff "Klimawandelanpassung"?',
        type: 'radio',
        required: true,
        options: [
          { value: 'true', label: 'Ja' },
          { value: 'false', label: 'Nein' },
        ],
      },
      {
        id: '4.2',
        key: 'description',
        title: 'Falls ja, beschreiben Sie kurz, was Sie darunter verstehen (optional)',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: '5',
    key: 'desiredChanges',
    title: 'Wenn Sie etwas ändern könnten um Hitze zu bekämpfen, was wäre es?',
    description:
      'Herausfinden was die Bürger sich wünschen und eventuell schlaue Ideen einholen. Klicken Sie auf die Icons, die für Sie relevant sind.',
    type: 'iconSelection',
    required: false,
    options: [
      { value: 'greening', label: 'Begrünung' },
      { value: 'water', label: 'Wasser' },
      { value: 'shadow', label: 'Schatten' },
      { value: 'shading', label: 'Verschattung' },
      { value: 'cooling', label: 'Kühlung' },
      { value: 'roof_greening', label: 'Dachbegrünung' },
      { value: 'facade_greening', label: 'Fassadenbegrünung' },
      { value: 'water_fountain', label: 'Wasserspender' },
    ],
  },
]
