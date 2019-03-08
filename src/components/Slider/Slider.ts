/**
 * Плагин слайдера
 *
 * Слайдер представляет из себя UI элемент с одним или несколькими ползунками которые можно двигать мышкой для изменения значения
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 08.03.2018
 */

import './Slider.scss';
import Logger from './../Core/Logger';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок селекта
 *   body   - тело селекта
 */
interface CallbackData {
  values: number[];
}

/**
 * Структура конфига слайдера
 *
 * Содержит:
 *   range    - диапазон значений слайдера
 *   points   - координаты ползунков на слайдере
 *   connect  - флаг, указывающий на то, нужно ли заполнять пространство между точками или нет
 *   callbacks
 *     created  - пользовательская функция, исполняющийся при успешном создании спойлера
 *     changed  - пользовательская функция, исполняющийся при изменении видимости спойлера
 */
interface Config {
  range: number[];
  points: number[];
  connect: boolean;
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс слайдера
 */
class Slider {
  // DOM элемент селекта
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Помощник для логирования
  readonly logger: Logger;

  // DOM элементы ползунков
  readonly pointsNodes: HTMLElement[];

  // DOM элемент соединительной полоски
  connectNode: HTMLElement | null;

  // Флаг определяющий нужна ли соединительная полоса
  isConnectNeeded: boolean;

  // Отношение ширины слайдера и его возможного максимального значения
  ratio: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект слайдера!');
    }

    // Инициализация переменных из конфига
    let points = [0];
    if (node && node.dataset.fazeSliderPoints) {
      points = node.dataset.fazeSliderPoints.split(',').map(point => parseInt(point, 10));
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      points,
      range: [parseInt(node.dataset.fazeSliderMin || '0', 10), parseInt(node.dataset.fazeSliderMax || '100', 10)],
      connect: true,
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    this.config = {...defaultConfig, ...config};
    this.node = node;
    this.logger = new Logger('Модуль Faze.Slider:');

    // Проверка конфига
    this.checkConfig();

    // Инициализация переменных
    this.ratio = this.node.getBoundingClientRect().width / this.config.range[1];
    this.pointsNodes = [];
    this.connectNode = null;
    this.isConnectNeeded = this.config.connect && this.config.points.length > 1;

    // Инициализация
    this.initialize();

    // Навешивание событий
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка класса, если этого не было сделано руками
    this.node.classList.add('faze-slider');

    // Инициализируем соединительную полоску, если необходимо
    if (this.isConnectNeeded) {
      this.createConnect();
    }

    // Инициализируем ползунки
    this.initializePoints();

    // Делаем просчёт позиции и размера полоски после инициализации точек
    if (this.isConnectNeeded) {
      this.calculateConnect();
    }

    // Вызываем пользовательскую функцию
    if (typeof this.config.callbacks.created === 'function') {
      // Собираем значения
      const values = this.pointsNodes.map(pointNode => parseInt((parseFloat(pointNode.style.left || '0') / this.ratio).toString(), 10));

      try {
        this.config.callbacks.created({
          values,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created", дословно: ${error}!`);
      }
    }
  }

  /**
   * Инициализация ползунков
   */
  initializePoints() {
    // Создаем ползунки
    this.config.points.forEach((point) => {
      this.createPoint(point);
    });
  }

  /**
   * Навешивание событий
   */
  bind() {
    this.bindPoints();
  }

  /**
   * Навешивание событий перетаскивания мышкой и пальцем на ползунки
   */
  bindPoints() {
    this.pointsNodes.forEach((pointNode, i) => {
      // Начальная позиция мыши
      let startMousePosition = 0;

      // КОнечная позиция мыши
      let endMousePosition = 0;

      // DOM элемент следующего ползунка
      const nextPointNode = <HTMLElement>pointNode.nextSibling;

      // DOM элемент предыдущего ползунка
      const prevPointNode = <HTMLElement>pointNode.previousSibling;

      /**
       * Функция нажатия на ползунок для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
       *
       * @param event - событие мыши
       */
      const dragMouseDown = (event: MouseEvent) => {
        // Получение позиции курсора при нажатии на элемент
        startMousePosition = event.clientX;

        document.addEventListener('mouseup', <any>endDragElement);
        document.addEventListener('touchend', <any>endDragElement);

        document.addEventListener('mousemove', <any>elementDrag);
        document.addEventListener('touchmove', <any>elementDrag);
      };

      /**
       * Функция перетаскивания ползунка
       *
       * @param event - событие мыши
       */
      const elementDrag = (event: any) => {
        // Рассчет новой позиции курсора
        endMousePosition = startMousePosition - (event.clientX || event.touches[0].clientX);
        startMousePosition = (event.clientX || event.touches[0].clientX);

        // Ширина всего слайдера
        const sliderWidth = this.node.getBoundingClientRect().width;

        // Проверки на выход из границ
        let position = pointNode.offsetLeft - endMousePosition;
        if (position <= 0) {
          position = 0;
        } else if (position >= sliderWidth) {
          position = sliderWidth;
        }

        // Проверка на заезд дальше следующего ползунка
        if (nextPointNode) {
          if (position >= nextPointNode.offsetLeft) {
            position = nextPointNode.offsetLeft;
          }
        }

        // Проверка на заезд до следующего ползунка
        if (prevPointNode && i !== 0) {
          if (position <= prevPointNode.offsetLeft) {
            position = prevPointNode.offsetLeft;
          }
        }

        // Рассчет новой позиции скролбара
        pointNode.style.left = `${position}px`;

        // Просчёт положения и размера соединительной полоски
        if (this.isConnectNeeded) {
          this.calculateConnect();
        }

        // Вызываем пользовательскую функцию
        if (typeof this.config.callbacks.changed === 'function') {
          // Собираем значения
          const values = this.pointsNodes.map(pointNode => parseInt((parseFloat(pointNode.style.left || '0') / this.ratio).toString(), 10));

          try {
            this.config.callbacks.changed({
              values,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "changed", дословно: ${error}!`);
          }
        }
      };

      /**
       * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
       */
      const endDragElement = () => {
        document.removeEventListener('mouseup', <any>endDragElement);
        document.removeEventListener('touchend', <any>endDragElement);

        document.removeEventListener('mousemove', <any>elementDrag);
        document.removeEventListener('touchmove', <any>elementDrag);
      };

      // Навешиваем событие перетаскивания
      pointNode.addEventListener('mousedown', <any>dragMouseDown);
      pointNode.addEventListener('touchstart', <any>dragMouseDown);
    });
  }

  /**
   * Создание соединительной полоски
   */
  createConnect() {
    this.connectNode = document.createElement('div');
    this.connectNode.className = 'faze-connect';

    this.node.appendChild(this.connectNode);
  }

  /**
   * Расчет положения и ширины соединительной полоски
   */
  calculateConnect() {
    if (this.connectNode) {
      // Ширина - это расстояние между самыми крайними точками
      const width = this.pointsNodes[this.pointsNodes.length - 1].offsetLeft - this.pointsNodes[0].offsetLeft;

      this.connectNode.style.width = `${width}px`;
      this.connectNode.style.left = `${this.pointsNodes[0].offsetLeft + this.pointsNodes[0].getBoundingClientRect().width / 2}px`;
    }
  }

  /**
   * Создание ползунка
   *
   * @param position - его положение на слайдере
   */
  createPoint(position: number) {
    // Создаем DOM элемент ползунка
    const pointNode = document.createElement('div');
    pointNode.className = 'faze-pointer';
    pointNode.style.left = `${position * this.ratio}px`;

    // Добавляем его в общий массив
    this.pointsNodes.push(pointNode);

    // Добавляем его в код страницы
    this.node.appendChild(pointNode);
  }

  /**
   * Проверка конфига на кооректность
   */
  checkConfig() {
    this.checkRange();
  }

  /**
   * Проверка диапазона
   */
  checkRange() {
    // Если не задан диапазон
    if (!this.config.range) {
      this.logger.error('Не задан диапазон значений для слайдера!');
    }

    // Если только одно значение
    if (this.config.range.length !== 2) {
      this.logger.error('Необходимо задать два значения в поле "range"!');
    }
  }

  /**
   * Простановка значения для точки с указанным индексом
   *
   * @param index - индекс ползунка
   * @param value - значение
   */
  setValue(index: number, value: number) {
    const pointNode = this.pointsNodes[index];
    if (pointNode) {
      pointNode.style.left = `${value * this.ratio}px`;
    }

    // Пересчёт соединительной полосы
    this.calculateConnect();
  }

  /**
   * Простановка значений для точек
   *
   * @param values - массив значений, где индекс значения равен индексу точки
   */
  setValues(values: number[]) {
    values.forEach((value, i) => {
      this.setValue(i, value);
    });
  }
}

export default Slider;
