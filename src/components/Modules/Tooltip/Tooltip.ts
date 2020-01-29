/**
 * Плагин тултипа
 *
 * Тултип(подсказка) представляет из себя элемент, который появляется сбоку(с любого из четырех) от элемента и содержит текст-подсказку
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 23.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Tooltip
 */

import './Tooltip.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';

/**
 * Структура конфига тултипа
 *
 * Содержит:
 *   text   - текст подсказки
 *   side   - сторона с которой должена появляться подсказка
 *   margin - отступ от выбранной стороны(side) в пикселях
 *   class  - кастомный класс
 *   callbacks
 *     opened  - пользовательская функция, срабатывающая при показе тултипа
 */
interface Config {
  text: string;
  side: string;
  margin: number;
  class: string;
  callbacks: {
    opened?: () => void;
  };
}

/**
 * Класс тултипа
 */
class Tooltip {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент для отрисовки тултипа
  readonly tooltip: HTMLDivElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект у которого должен отображаться тултип.');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Tooltip:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-tooltip-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      text: '',
      side: 'bottom',
      margin: 10,
      class: '',
      callbacks: {
        opened: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    // Проверка на то, что сторона задана правильно
    if (!['top', 'bottom', 'right', 'left'].includes(this.config.side)) {
      this.logger.error('Параметр "side" задан верно! Корректные значения: "top", "right", "bottom", "left".');
    }

    // Инициализация переменных
    this.node = node;
    this.tooltip = document.createElement('div');

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.tooltip.className = `faze-tooltip faze-tooltip-initialized faze-tooltip-${this.config.side} ${this.config.class}`;
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.innerHTML = this.config.text || this.node.dataset.fazeTooltipText || this.node.title || '';
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.node.addEventListener('mouseenter', () => {
      // Если не нужно показывать тултип, то выходим из метода
      if (this.node.dataset.fazeTooltipDisabled === 'true') {
        return;
      }

      // Для начала скрываем тултип для первичного рассчета его данных
      this.tooltip.style.visibility = 'hidden';
      document.body.appendChild(this.tooltip);

      // Рассчет позиционирования и размеров
      this.calculatePositionAndSize();

      // Показываем тултип
      this.tooltip.style.visibility = 'visible';

      // Вызываем пользовательский метод
      if (typeof this.config.callbacks.opened === 'function') {
        try {
          this.config.callbacks.opened();
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
        }
      }
    });

    // Удаление тултипа при выводе мышки за пределы DOM элемента который вызывает тултип
    this.node.addEventListener('mouseleave', () => {
      this.tooltip.remove();
    });
  }

  /**
   * Рассчет позиции и размеров тултипа
   */
  calculatePositionAndSize(): void {
    // Кэшируем данные для рассчета
    const callerRect = this.node.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Рассчет отступов
    const offsetHorizontal = callerRect.width / 2 + tooltipRect.width / 2 + this.config.margin;
    const offsetVertical = callerRect.height / 2 + tooltipRect.height / 2 + this.config.margin;

    const documentElement = document.documentElement;
    let left = 0;
    let top = 0;
    if (documentElement) {
      left = (window.pageXOffset || documentElement.scrollLeft) - (documentElement.clientLeft || 0);
      top = (window.pageYOffset || documentElement.scrollTop) - (documentElement.clientTop || 0);
    }

    // Рассчет центров
    let centerX = callerRect.left + callerRect.width / 2 - tooltipRect.width / 2 + left;
    let centerY = callerRect.top + callerRect.height / 2 - tooltipRect.height / 2 + top;

    // Применение отступа в зависимости от стороны
    switch (this.config.side) {
      case 'top':
        centerY -= offsetVertical;
        break;
      case 'left':
        centerX -= offsetHorizontal;
        break;
      case 'right':
        centerX += offsetHorizontal;
        break;
      case 'bottom':
      default:
        centerY += offsetVertical;
        break;
    }

    // Применение данных на тултип
    this.tooltip.style.top = `${centerY}px`;
    this.tooltip.style.left = `${centerX}px`;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param tooltipNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(tooltipNode: HTMLElement) {
    new Faze.Tooltip(tooltipNode, {
      text: tooltipNode.dataset.fazeTooltipText || '',
      side: tooltipNode.dataset.fazeTooltipSide || 'bottom',
      class: tooltipNode.dataset.fazeTooltipClass || '',
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="tooltip"]', (tooltipNode: HTMLElement) => {
      Tooltip.initializeByDataAttributes(tooltipNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="tooltip"]').forEach((tooltipNode: HTMLElement) => {
      Tooltip.initializeByDataAttributes(tooltipNode);
    });
  }
}

export default Tooltip;