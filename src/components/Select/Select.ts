/**
 * Плагин селекта
 *
 * Селект представляет из себя "стандартный" селект, только с возможностью кастомизирования через CSS стили.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   PlarsonJS.add({
 *     pluginName: 'FilterSelects',
 *     plugins: ['Select'],
 *     condition: document.querySelectorAll('.select').length,
 *     callback: () => {
 *       new PlarsonJS.Select(document.querySelector('.select'));
 *     }
 *   });
 *
 * В HTML:
 *   <div class="dropdown">
 *     <div class="title">Дропдаун</div>
 *     <div class="body">Тело дропдауна</div>
 *   </div>
 */

import './Select.scss';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   callbacks
 *     created  - пользовательский метод, исполняющийся при успешном создании дропдауна
 *     opened   - пользовательский метод, исполняющийся при открытии дропдауна
 */
interface Config {
  default: boolean;
  positionTopOffset: number;
  callbacks: {
    created?: (data: CallbackData) => void,
    changed?: (data: CallbackData) => void,
  };
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок дропдауна
 *   body   - тело дропдауна
 */
interface CallbackData {
  title: HTMLElement | null;
  body: HTMLElement | null;
  value: string | null;
}

/**
 * Класс дропдауна
 */
class Select {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Заголовок дропдауна
  title: HTMLElement | null;

  // Тело дропдауна
  body: HTMLElement | null;

  // Опции селекта которые можно выбирать
  options: NodeListOf<HTMLElement>;

  // Выбранное значение
  value: string | null;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект селекта');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      default: true,
      positionTopOffset: 0,
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Поиск основных элементов и проверка на то что они найдены
    this.title = this.node.querySelector('.title');
    this.body = this.node.querySelector('.body');

    if (!this.title || !this.body) {
      throw new Error('Для селекта не найдены шапка и тело');
    }

    // Присвоение сдвига для тела
    this.body.style.top = `${this.title.offsetHeight + this.config.positionTopOffset}px`;

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // Берем все опции в селекте
    this.options = this.body.querySelectorAll('.option');

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          title: this.title,
          body: this.body,
          value: null,
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательского метода "created":', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (!this.title || !this.body) {
      throw new Error('Не заданы шапка и тело селекта');
    }

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // При нажатии на заголовок, меняем видимость тела селекта
    this.title.addEventListener('click', (event) => {
      event.preventDefault();

      if (!this.node.classList.contains('disabled')) {
        this.node.classList.toggle('active');
      }
    });

    // Навешиваем события на нажатие по опциям, при нажатии нужно сделать её активной,
    // то есть её надпись поставить в заголовок селекта и запомнить выбранное значение
    this.options.forEach((option) => {
      option.addEventListener('click', (event) => {
        event.preventDefault();

        if (!this.title) {
          throw new Error('Не задана шапка селекта');
        }

        // Меняем заголовок
        this.title.textContent = option.getAttribute('data-caption') || option.textContent;
        this.value = option.getAttribute('data-value') || option.textContent;

        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.changed === 'function') {
          try {
            this.config.callbacks.changed({
              title: this.title,
              body: this.body,
              value: this.value,
            });
          } catch (e) {
            console.error(e);
          }
        }

        // Закрываем селект
        this.node.classList.remove('active');

        // Скрываем выбранную опцию
        this.hideOption(this.value);
      });
    });

    // Проверка на нажатие за пределами селекта
    document.addEventListener('click', (event: any) => {
      const path = event.path || (event.composedPath && event.composedPath());
      if (path) {
        if (!path.find((element: any) => element === this.node)) {
          this.node.classList.remove('active');
        }
      }
    });
  }

  /**
   * Пересоздание заголовка, для сброса всех биндов на нём
   * Нужно для реинициализации дропдауна
   */
  resetTitle(): void {
    if (!this.title) {
      throw new Error('Не задана шапка дропдауна');
    }

    const cloneTitle = this.title.cloneNode(true);
    if (this.title.parentNode) {
      this.title.parentNode.replaceChild(cloneTitle, this.title);
      this.title = <HTMLElement>cloneTitle;
    }
  }

  /**
   * Скрываем опцию с заданным значением
   *
   * @param value - значение, если у опции такое же, то скрываем её
   */
  hideOption(value: string | null) {
    this.options.forEach((option) => {
      const optionValue = option.getAttribute('data-value') || option.textContent;

      if (optionValue === value) {
        option.style.display = 'none';
      } else {
        option.style.display = 'block';
      }
    });
  }
}

export default Select;