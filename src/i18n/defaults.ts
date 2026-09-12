import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Заготовки для блоков, которых может не быть в сохранённом содержимом.
 *
 * Сайт уже работает, и его тексты лежат в хранилище в старом виде — без новых
 * разделов. Чтобы новые блоки появились сразу, а не после ручного заполнения
 * админки, недостающие куски берутся отсюда. Всё, что человек сохранил сам,
 * всегда важнее заготовки.
 */
export type DictionaryDefaults = {
  [K in Locale]: DeepPartial<Dictionary>;
};

type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** Значение из сохранённого содержимого всегда перекрывает заготовку. */
export function mergeDefaults<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override as T;
  if (base && override && typeof base === "object" && typeof override === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
      out[key] =
        key in (base as Record<string, unknown>)
          ? mergeDefaults((base as Record<string, unknown>)[key], value)
          : value;
    }
    return out as T;
  }
  return override as T;
}

export const defaultTexts: DictionaryDefaults = {
  ru: {
    nav: { materials: "Материалы" },
    calc: {
      button: "Получить расчёт стоимости",
      title: "Пришлите чертежи или спецификацию — подберём для вас материалы и сделаем предварительный расчёт",
      lead: "Ответим в рабочее время. Чертёж можно приложить файлом — так расчёт будет точнее.",
      name: "Имя",
      company: "Компания",
      phone: "Телефон",
      objectType: "Тип объекта",
      area: "Площадь фасада, м²",
      material: "Необходимый материал",
      stage: "Стадия проекта",
      file: "Чертёж или спецификация",
      fileHint: "PDF, DWG, XLS, JPG или архив — до 15 МБ",
      objectTypes: [
        "Жилой комплекс",
        "Бизнес-центр",
        "Торговый центр",
        "Гостиница",
        "Частный дом",
        "Промышленный объект",
        "Другое",
      ],
      materials: [
        "Алюминиевые композитные панели (АКП)",
        "Клинкерная плитка",
        "Керамогранит",
        "HPL-панели",
        "Подсистема",
        "Крепёж",
        "Пока не определились",
      ],
      stages: [
        "Идея, изучаем варианты",
        "Проектирование",
        "Готов проект, нужен расчёт",
        "Идёт стройка",
        "Тендер",
      ],
      submit: "Отправить заявку",
      done: "Спасибо! Мы свяжемся с вами в рабочее время.",
      error: "Не удалось отправить. Позвоните нам, пожалуйста.",
      telegram: "Написать в Telegram",
      choose: "Выберите",
      fileChoose: "Выбрать файл",
      fileRemove: "Убрать",
      required: "Заполните имя и телефон",
      errName: "Укажите имя — минимум две буквы",
      errPhone: "Проверьте номер: нужен настоящий телефон, например +998 90 123-45-67",
      errArea: "Площадь — число, например 1200",
      phoneHint: "+998 90 123-45-67",
    },
    materials: {
      title: "Материалы",
      lead: "Поставляем фасадные материалы напрямую от заводов-производителей и подбираем их под конкретный объект и бюджет.",
      items: [
        {
          title: "Алюминиевые композитные панели",
          text: "АКП для вентилируемых фасадов: широкая палитра, стабильная геометрия, негорючие варианты сердечника.",
        },
        {
          title: "Клинкерная плитка",
          text: "Фасадная клинкерная плитка и термопанели: натуральный цвет, стойкость к морозу и выгоранию.",
        },
        {
          title: "Керамогранит",
          text: "Крупноформатные плиты для навесных фасадов: матовые, полированные и структурированные поверхности.",
        },
        {
          title: "HPL-панели",
          text: "Панели высокого давления для фасадов и интерьеров: ударопрочные, с широким выбором декоров.",
        },
        {
          title: "Подсистемы",
          text: "Алюминиевые и оцинкованные подконструкции с расчётом под ветровую нагрузку и шаг несущих элементов.",
        },
        {
          title: "Крепёж",
          text: "Заклёпки, кляммеры, анкеры и уплотнители — комплектуем весь узел, чтобы на объекте ничего не пришлось искать.",
        },
      ],
    },
    process: {
      title: "Как мы работаем",
      lead: "От первого звонка до сопровождения монтажа — понятный порядок работы.",
      steps: [
        { title: "Заявка и консультация", text: "Уточняем объект, задачи и сроки. При необходимости выезжаем на площадку." },
        { title: "Подбор материалов", text: "Предлагаем варианты под архитектуру, требования и бюджет объекта." },
        { title: "Расчёт и КП", text: "Считаем материалы и подсистему по чертежам, готовим коммерческое предложение." },
        { title: "Договор и согласование", text: "Фиксируем объёмы, цвета, сроки поставки и условия в договоре." },
        { title: "Поставка", text: "Привозим материалы на объект партиями под график монтажа." },
        { title: "Сопровождение монтажа", text: "Консультируем подрядчика по узлам и контролируем соответствие проекту." },
      ],
    },
    docs: {
      title: "Документы и сертификаты",
      lead: "На каждую поставку предоставляем полный пакет документов, действующих на территории Узбекистана.",
      items: [
        { title: "Сертификаты соответствия", text: "Документы на материалы, действующие на территории Республики Узбекистан." },
        { title: "Технические паспорта", text: "Паспорта качества и технические характеристики от заводов-производителей." },
        { title: "Пожарные показатели", text: "Протоколы испытаний и классы пожарной опасности материалов." },
        { title: "Гарантия производителя", text: "Официальные гарантийные обязательства заводов, чьими представителями мы являемся." },
      ],
      note: "Полный пакет документов по конкретному материалу отправим по запросу.",
      open: "Смотреть документ",
    },
    group: {
      title: "Опыт группы компаний",
      lead: "Smart Facade выходит на рынок Узбекистана с опытом, накопленным в Кыргызстане.",
      text: "Более 10 лет работы на строительном рынке Кыргызстана и свыше 200 000 м² выполненных фасадов. Этот опыт, отлаженные поставки и прямые контракты с заводами мы переносим на объекты в Узбекистане.",
      stats: [
        { value: "10", label: "лет на строительном рынке" },
        { value: "200 000", label: "м² фасадов в Кыргызстане" },
      ],
    },
  },

  uz: {
    nav: { materials: "Materiallar" },
    calc: {
      button: "Narx hisob-kitobini olish",
      title: "Chizmalar yoki spetsifikatsiyani yuboring — materiallarni tanlab, dastlabki hisob-kitobni tayyorlaymiz",
      lead: "Ish vaqtida javob beramiz. Chizmani fayl sifatida biriktirsangiz, hisob aniqroq bo‘ladi.",
      name: "Ism",
      company: "Kompaniya",
      phone: "Telefon",
      objectType: "Obyekt turi",
      area: "Fasad maydoni, m²",
      material: "Kerakli material",
      stage: "Loyiha bosqichi",
      file: "Chizma yoki spetsifikatsiya",
      fileHint: "PDF, DWG, XLS, JPG yoki arxiv — 15 MB gacha",
      objectTypes: [
        "Turar-joy majmuasi",
        "Biznes markaz",
        "Savdo markazi",
        "Mehmonxona",
        "Xususiy uy",
        "Sanoat obyekti",
        "Boshqa",
      ],
      materials: [
        "Alyuminiy kompozit panellar (AKP)",
        "Klinker plitka",
        "Keramogranit",
        "HPL panellar",
        "Quyi tizim",
        "Mahkamlagichlar",
        "Hali aniqlanmagan",
      ],
      stages: [
        "G‘oya, variantlarni o‘rganyapmiz",
        "Loyihalash",
        "Loyiha tayyor, hisob kerak",
        "Qurilish ketmoqda",
        "Tender",
      ],
      submit: "Arizani yuborish",
      done: "Rahmat! Ish vaqtida siz bilan bog‘lanamiz.",
      error: "Yuborib bo‘lmadi. Iltimos, qo‘ng‘iroq qiling.",
      telegram: "Telegram orqali yozish",
      choose: "Tanlang",
      fileChoose: "Fayl tanlash",
      fileRemove: "Olib tashlash",
      required: "Ism va telefonni to‘ldiring",
      errName: "Ismni kiriting — kamida ikkita harf",
      errPhone: "Raqamni tekshiring: haqiqiy telefon kerak, masalan +998 90 123-45-67",
      errArea: "Maydon — son, masalan 1200",
      phoneHint: "+998 90 123-45-67",
    },
    materials: {
      title: "Materiallar",
      lead: "Fasad materiallarini bevosita ishlab chiqaruvchi zavodlardan yetkazib beramiz va ularni obyekt hamda byudjetga moslab tanlaymiz.",
      items: [
        {
          title: "Alyuminiy kompozit panellar",
          text: "Ventilyatsiyalanadigan fasadlar uchun AKP: keng rang palitrasi, barqaror geometriya, yonmaydigan o‘zak variantlari.",
        },
        {
          title: "Klinker plitka",
          text: "Fasad klinker plitkasi va termopanellar: tabiiy rang, sovuq va quyoshga chidamlilik.",
        },
        {
          title: "Keramogranit",
          text: "Osma fasadlar uchun yirik formatli plitalar: mat, silliqlangan va strukturali yuzalar.",
        },
        {
          title: "HPL panellar",
          text: "Fasad va interyer uchun yuqori bosimli panellar: zarbaga chidamli, dekorlar tanlovi keng.",
        },
        {
          title: "Quyi tizimlar",
          text: "Alyuminiy va rux qoplamali quyi konstruksiyalar — shamol yuki va qadam bo‘yicha hisob bilan.",
        },
        {
          title: "Mahkamlagichlar",
          text: "Parchinlar, klyammerlar, ankerlar va zichlagichlar — butun tugunni to‘liq komplektlaymiz.",
        },
      ],
    },
    process: {
      title: "Qanday ishlaymiz",
      lead: "Birinchi qo‘ng‘iroqdan montajni kuzatishgacha — tushunarli ish tartibi.",
      steps: [
        { title: "Ariza va maslahat", text: "Obyekt, vazifalar va muddatlarni aniqlaymiz. Kerak bo‘lsa, joyiga chiqamiz." },
        { title: "Materiallarni tanlash", text: "Arxitektura, talab va byudjetga mos variantlarni taklif qilamiz." },
        { title: "Hisob va tijorat taklifi", text: "Chizmalar bo‘yicha material va quyi tizimni hisoblab, taklif tayyorlaymiz." },
        { title: "Shartnoma va kelishuv", text: "Hajm, ranglar, yetkazib berish muddati va shartlarni shartnomada belgilaymiz." },
        { title: "Yetkazib berish", text: "Materiallarni montaj jadvaliga mos ravishda partiyalar bilan olib kelamiz." },
        { title: "Montajni kuzatish", text: "Pudratchiga tugunlar bo‘yicha maslahat beramiz va loyihaga muvofiqlikni nazorat qilamiz." },
      ],
    },
    docs: {
      title: "Hujjatlar va sertifikatlar",
      lead: "Har bir yetkazib berish uchun O‘zbekiston hududida amal qiluvchi to‘liq hujjatlar to‘plamini taqdim etamiz.",
      items: [
        { title: "Muvofiqlik sertifikatlari", text: "O‘zbekiston Respublikasi hududida amal qiluvchi material hujjatlari." },
        { title: "Texnik passportlar", text: "Ishlab chiqaruvchi zavodlarning sifat passportlari va texnik tavsiflari." },
        { title: "Yong‘in ko‘rsatkichlari", text: "Sinov bayonnomalari va materiallarning yong‘in xavfi sinflari." },
        { title: "Ishlab chiqaruvchi kafolati", text: "Biz vakili bo‘lgan zavodlarning rasmiy kafolat majburiyatlari." },
      ],
      note: "Aniq material bo‘yicha to‘liq hujjatlar to‘plamini so‘rov bo‘yicha yuboramiz.",
      open: "Hujjatni ko‘rish",
    },
    group: {
      title: "Kompaniyalar guruhi tajribasi",
      lead: "Smart Facade O‘zbekiston bozoriga Qirg‘izistonda to‘plangan tajriba bilan chiqmoqda.",
      text: "Qirg‘iziston qurilish bozorida 10 yildan ortiq faoliyat va 200 000 m² dan ortiq bajarilgan fasadlar. Shu tajriba, yo‘lga qo‘yilgan yetkazib berish va zavodlar bilan to‘g‘ridan-to‘g‘ri shartnomalarni O‘zbekistondagi obyektlarga olib kelamiz.",
      stats: [
        { value: "10", label: "yil qurilish bozorida" },
        { value: "200 000", label: "m² fasad Qirg‘izistonda" },
      ],
    },
  },

  en: {
    nav: { materials: "Materials" },
    calc: {
      button: "Get a cost estimate",
      title: "Send us drawings or a specification — we will select materials and prepare a preliminary estimate",
      lead: "We reply during business hours. Attaching a drawing makes the estimate more accurate.",
      name: "Name",
      company: "Company",
      phone: "Phone",
      objectType: "Type of building",
      area: "Facade area, m²",
      material: "Material required",
      stage: "Project stage",
      file: "Drawing or specification",
      fileHint: "PDF, DWG, XLS, JPG or an archive — up to 15 MB",
      objectTypes: [
        "Residential complex",
        "Office building",
        "Shopping centre",
        "Hotel",
        "Private house",
        "Industrial facility",
        "Other",
      ],
      materials: [
        "Aluminium composite panels (ACP)",
        "Clinker tiles",
        "Porcelain stoneware",
        "HPL panels",
        "Subframe",
        "Fasteners",
        "Not decided yet",
      ],
      stages: [
        "Idea, exploring options",
        "Design stage",
        "Design ready, estimate needed",
        "Construction in progress",
        "Tender",
      ],
      submit: "Send request",
      done: "Thank you! We will contact you during business hours.",
      error: "Could not send the request. Please give us a call.",
      telegram: "Message on Telegram",
      choose: "Select",
      fileChoose: "Choose file",
      fileRemove: "Remove",
      required: "Please fill in your name and phone",
      errName: "Enter your name — at least two letters",
      errPhone: "Check the number: a real phone is required, e.g. +998 90 123-45-67",
      errArea: "Area must be a number, e.g. 1200",
      phoneHint: "+998 90 123-45-67",
    },
    materials: {
      title: "Materials",
      lead: "We supply facade materials directly from the manufacturing plants and match them to the building and the budget.",
      items: [
        {
          title: "Aluminium composite panels",
          text: "ACP for ventilated facades: a wide colour range, stable geometry and non-combustible core options.",
        },
        {
          title: "Clinker tiles",
          text: "Facade clinker tiles and thermal panels: natural colour, frost and fade resistance.",
        },
        {
          title: "Porcelain stoneware",
          text: "Large-format slabs for curtain-wall facades: matt, polished and structured surfaces.",
        },
        {
          title: "HPL panels",
          text: "High-pressure laminate panels for facades and interiors: impact resistant, with a wide choice of decors.",
        },
        {
          title: "Subframes",
          text: "Aluminium and galvanised substructures calculated for wind load and bracket spacing.",
        },
        {
          title: "Fasteners",
          text: "Rivets, clamps, anchors and seals — we supply the complete assembly so nothing is missing on site.",
        },
      ],
    },
    process: {
      title: "How we work",
      lead: "From the first call to installation support — a clear order of work.",
      steps: [
        { title: "Request and consultation", text: "We clarify the building, the tasks and the deadlines, and visit the site if needed." },
        { title: "Material selection", text: "We propose options that suit the architecture, the requirements and the budget." },
        { title: "Estimate and offer", text: "We calculate materials and the subframe from the drawings and prepare a commercial offer." },
        { title: "Contract", text: "Volumes, colours, delivery dates and terms are fixed in the contract." },
        { title: "Delivery", text: "Materials arrive on site in batches, following the installation schedule." },
        { title: "Installation support", text: "We advise the contractor on assemblies and check compliance with the design." },
      ],
    },
    docs: {
      title: "Documents and certificates",
      lead: "Every delivery comes with a full set of documents valid in Uzbekistan.",
      items: [
        { title: "Certificates of conformity", text: "Material documents valid on the territory of the Republic of Uzbekistan." },
        { title: "Technical data sheets", text: "Quality passports and technical specifications from the manufacturing plants." },
        { title: "Fire performance", text: "Test reports and fire hazard classes of the materials." },
        { title: "Manufacturer warranty", text: "Official warranty obligations of the plants we represent." },
      ],
      note: "We will send the full document package for a specific material on request.",
      open: "View document",
    },
    group: {
      title: "Experience of the group",
      lead: "Smart Facade enters the Uzbek market with experience gained in Kyrgyzstan.",
      text: "More than 10 years on the construction market of Kyrgyzstan and over 200,000 m² of completed facades. We bring that experience, established supply chains and direct contracts with the plants to projects in Uzbekistan.",
      stats: [
        { value: "10", label: "years on the construction market" },
        { value: "200,000", label: "m² of facades in Kyrgyzstan" },
      ],
    },
  },
};
