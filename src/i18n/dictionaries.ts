export type Dictionary = {
  nav: {
    home: string;
    about: string;
    services: string;
    projects: string;
    partners: string;
    /** пункт меню «Материалы» — ведёт к блоку материалов на главной */
    materials: string;
    /** ссылка на страницу контактов (меню, подвал) */
    contacts: string;
    /** надпись на кнопке, которая открывает форму заявки */
    contactButton: string;
  };
  hero: {
    title: string[];
    lead: string;
    phonesLabel: string;
    contact: string;
    whatsapp: string;
    instagram: string;
  };
  about: {
    title: string;
    subtitle: string;
    text: string;
    specs: string[];
    more: string;
  };
  services: {
    title: string;
    lead: string;
    items: string[];
  };
  projects: {
    title: string;
    lead: string;
    all: string;
    items: string[];
  };
  beforeAfter: { title: string; lead: string; before: string; after: string };
  stats: { value: string; label: string }[];
  /** Блок «Материалы» на главной */
  materials: {
    title: string;
    lead: string;
    items: { title: string; text: string }[];
  };
  /** Блок «Как мы работаем» */
  process: {
    title: string;
    lead: string;
    steps: { title: string; text: string }[];
  };
  /** Блок «Документы и сертификаты» */
  docs: {
    title: string;
    lead: string;
    items: { title: string; text: string }[];
    note: string;
    /** подпись ссылки на прикреплённый файл */
    open: string;
  };
  /** Блок «Опыт группы компаний» */
  group: {
    title: string;
    lead: string;
    text: string;
    stats: { value: string; label: string }[];
  };
  /** Форма «Получить расчёт стоимости» */
  calc: {
    button: string;
    title: string;
    lead: string;
    name: string;
    company: string;
    phone: string;
    objectType: string;
    area: string;
    material: string;
    stage: string;
    file: string;
    fileHint: string;
    objectTypes: string[];
    materials: string[];
    stages: string[];
    submit: string;
    done: string;
    error: string;
    telegram: string;
    choose: string;
    fileChoose: string;
    fileRemove: string;
    required: string;
    /** подсказки при неверно заполненных полях */
    errName: string;
    errPhone: string;
    errArea: string;
    phoneHint: string;
  };
  representatives: { title: string };
  partners: { title: string };
  cta: { title: string[]; text: string[]; button: string };
  footer: {
    contactsTitle: string;
    address: string;
    companyTitle: string;
    links: string[];
    copyright: string;
    socialTitle: string;
    callbackTitle: string;
    callbackText: string;
    callbackPlaceholder: string;
    callbackDone: string;
    callbackError: string;
  };
  pages: {
    about: {
      heading: string;
      subtitle: string;
      text: string;
      advantagesTitle: string;
      advantagesLead: string;
      advantages: { title: string; text: string }[];
    };
    services: { heading: string; intro: string };
    projects: {
      heading: string;
      buildingLabel: string;
      materialLabel: string;
      all: string;
      open: string;
      empty: string;
      buildings: Record<string, string>;
      materials: Record<string, string>;
    };
    partners: { heading: string };
    project: {
      back: string;
      material: string;
      area: string;
      colors: string;
    };
    contacts: {
      heading: string;
      formTitle: string;
      name: string;
      phone: string;
      message: string;
      submit: string;
      addressTitle: string;
      phonesTitle: string;
      emailTitle: string;
      socialTitle: string;
    };
  };
};
