/*-----------------------------------------------------------------

Template Name: AIForge - AI Startup & Technology HTML Template 
Author:  namespace-it
Author URI: https://themeforest.net/user/namespace-itportfolio
Version: 1.0.0
Description: AIForge - AI Startup & Technology HTML Template <

-------------------------------------------------------------------
CSS TABLE OF CONTENTS
-------------------------------------------------------------------

01. header
02. animated text with swiper slider
03. magnificPopup
04. counter up
05. wow animation
06. nice select
07. swiper slider
08. search popup
09. mousecursor 
09. preloader 
10. accordion
11. comparison table toggle

------------------------------------------------------------------*/

(function ($) {
  'use strict';

  $(document).ready(function () {
    //>> Mobile Menu Js Start <<//
    $('#mobile-menu').meanmenu({
      meanMenuContainer: '.mobile-menu',
      meanScreenWidth: '1640',
      meanExpand: ['<i class="far fa-plus"></i>'],
    });

    //>> Sidebar Toggle Js Start <<//
    $('.offcanvas__close,.offcanvas__overlay').on('click', function () {
      $('.offcanvas__info').removeClass('info-open');
      $('.offcanvas__overlay').removeClass('overlay-open');
    });
    $('.sidebar__toggle').on('click', function () {
      $('.offcanvas__info').addClass('info-open');
      $('.offcanvas__overlay').addClass('overlay-open');
    });

    //>> Body Overlay Js Start <<//
    $('.body-overlay').on('click', function () {
      $('.offcanvas__area').removeClass('offcanvas-opened');
      $('.df-search-area').removeClass('opened');
      $('.body-overlay').removeClass('opened');
    });

    //>> Sticky Header Js Start <<//

    $(window).scroll(function () {
      if ($(this).scrollTop() > 250) {
        $('#header-sticky').addClass('sticky');
      } else {
        $('#header-sticky').removeClass('sticky');
      }
    });

    //>> Video Popup Start <<//
    $('.img-popup').magnificPopup({
      type: 'image',
      gallery: {
        enabled: true,
      },
    });

    $('.video-popup').magnificPopup({
      type: 'iframe',
      callbacks: {},
    });

    //>> Counterup Start <<//
    $('.count').counterUp({
      delay: 15,
      time: 4000,
    });

    //>> Wow Animation Start <<//
    new WOW().init();

    //>> Nice Select Start <<//
    $('select').niceSelect();

    //>> Hero-3 Slider Start <<//

    // Hero Slider Start <<//
    const sliderActive1 = '.news-hero-slider';
    const sliderInit1 = new Swiper(sliderActive1, {
      loop: true,
      slidesPerView: 1,
      effect: 'fade',
      speed: 2000,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.array-prev',
        prevEl: '.array-next',
      },
    });

    // content animation when active start here
    function animated_swiper(selector, init) {
      var animated = function animated() {
        $(selector + ' [data-animation]').each(function () {
          var anim = $(this).data('animation');
          var delay = $(this).data('delay');
          var duration = $(this).data('duration');
          $(this)
            .removeClass('anim' + anim)
            .addClass(anim + ' animated')
            .css({
              webkitAnimationDelay: delay,
              animationDelay: delay,
              webkitAnimationDuration: duration,
              animationDuration: duration,
            })
            .one('animationend', function () {
              $(this).removeClass(anim + ' animated');
            });
        });
      };
      animated();
      init.on('slideChange', function () {
        $(sliderActive1 + ' [data-animation]').removeClass('animated');
      });
      init.on('slideChange', animated);
    }

    animated_swiper(sliderActive1, sliderInit1);

    //>> Brand Slider Start <<//
    if ($('.brand-slider').length > 0) {
      const brandSlider = new Swiper('.brand-slider', {
        spaceBetween: 30,
        speed: 2000,
        centeredSlides: true,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        breakpoints: {
          1199: {
            slidesPerView: 5,
          },
          991: {
            slidesPerView: 3,
          },
          767: {
            slidesPerView: 2,
          },
          575: {
            slidesPerView: 2,
          },
          400: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    //>> Testimonial Slider Start <<//
    if ($('.testimonail-slider').length > 0) {
      const testimonailSlider = new Swiper('.testimonail-slider', {
        spaceBetween: 30,
        speed: 2000,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        breakpoints: {
          991: {
            slidesPerView: 1,
          },
          767: {
            slidesPerView: 1,
          },
          575: {
            slidesPerView: 1,
          },
          400: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    if ($('.testimonial-slider-2').length > 0) {
      const testimonialSlider2 = new Swiper('.testimonial-slider-2', {
        spaceBetween: 30,
        speed: 3000,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        navigation: {
          prevEl: '.array-next',
          nextEl: '.array-prev',
        },
      });
    }

    if ($('.testimonial-slider-3').length > 0) {
      const testimonialSlider3 = new Swiper('.testimonial-slider-3', {
        spaceBetween: 30,
        speed: 3000,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      });
    }

    //>> Showcase Slider Start <<//
    if ($('.showcase-slider').length > 0) {
      const showcaseSlider = new Swiper('.showcase-slider', {
        spaceBetween: 30,
        speed: 2000,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        breakpoints: {
          991: {
            slidesPerView: 3,
          },
          767: {
            slidesPerView: 2,
          },
          575: {
            slidesPerView: 1,
          },
          400: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    //>> Testimonial Slider Start <<//
    if ($('.banner-slide-wrapper').length > 0) {
      const bannerSlideWrapper = new Swiper('.banner-slide-wrapper', {
        spaceBetween: 30,
        speed: 2000,
        loop: true,
        effect: 'fade',
        autoplay: {
          delay: 2000,
          disableOnInteraction: true,
        },
        breakpoints: {
          991: {
            slidesPerView: 1,
          },
          767: {
            slidesPerView: 1,
          },
          575: {
            slidesPerView: 1,
          },
          400: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    //>> Custom Accordion Tabs <<//
    $('.accordion-single .header-area').on('click', function () {
      if ($(this).closest('.accordion-single').hasClass('active')) {
        $(this).closest('.accordion-single').removeClass('active');
        $(this).next('.content-area').slideUp();
      } else {
        $('.accordion-single').removeClass('active');
        $(this).closest('.accordion-single').addClass('active');
        $('.content-area').not($(this).next('.content-area')).slideUp();
        $(this).next('.content-area').slideToggle();
      }
    });

    //>> team Slider Start <<//
    if ($('.team-slider').length > 0) {
      const TeamSlider = new Swiper('.team-slider', {
        spaceBetween: 30,
        speed: 1300,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: '.array-prev',
          prevEl: '.array-next',
        },
        breakpoints: {
          1199: {
            slidesPerView: 4,
          },
          991: {
            slidesPerView: 3,
          },
          767: {
            slidesPerView: 2,
          },
          575: {
            slidesPerView: 2,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    //>> Testimonial Slider Start <<//
    if ($('.testimonial-slider-5').length > 0) {
      const TestimonialSlider5 = new Swiper('.testimonial-slider-5', {
        spaceBetween: 30,
        speed: 1300,
        loop: true,
        autoplay: {
          delay: 1000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: '.array-prev',
          prevEl: '.array-next',
        },
        breakpoints: {
          1199: {
            slidesPerView: 3,
          },
          991: {
            slidesPerView: 3,
          },
          767: {
            slidesPerView: 2,
          },
          575: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    //>> Offer Slider Start <<//
    if ($('.offer-slider').length > 0) {
      const OfferSlider = new Swiper('.offer-slider', {
        spaceBetween: 30,
        speed: 1300,
        loop: true,
        autoplay: {
          delay: 1000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: '.array-prev',
          prevEl: '.array-next',
        },
        breakpoints: {
          1199: {
            slidesPerView: 3,
          },
          991: {
            slidesPerView: 3,
          },
          767: {
            slidesPerView: 2,
          },
          575: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        },
      });
    }

    // Left Side: Testimonial Content Slider
    if ($('.testimonial-slider-6').length > 0 && $('.swiper-image').length > 0) {
      const imageSwiper = new Swiper('.swiper-image', {
        effect: 'cards',
        grabCursor: true,
        loop: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        cardsEffect: {
          rotate: 0,
          perSlideRotate: 0,
          perSlideOffset: 3,
        },
      });

      const contentSwiper = new Swiper('.testimonial-slider-6', {
        spaceBetween: 30,
        speed: 1300,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: '.array-prev',
          prevEl: '.array-next',
        },
        breakpoints: {
          0: { slidesPerView: 1 },
          575: { slidesPerView: 1 },
          767: { slidesPerView: 1 },
          991: { slidesPerView: 1 },
          1199: { slidesPerView: 1 },
          1399: { slidesPerView: 1 },
        },
      });

      // Link the two Swipers
      contentSwiper.controller.control = imageSwiper;
      imageSwiper.controller.control = contentSwiper;
    }

    //>> Progress Bar Js Start <<//
    $('.progress-bar').waypoint(
      function () {
        $('.progress-bar').css({
          animation: 'animate-positive 2.6s',
          opacity: '1',
        });
      },
      { offset: '75%' }
    );

    //>> Back To Top Slider Start <<//
    $(window).scroll(function () {
      if ($(this).scrollTop() > 20) {
        $('#back-top').addClass('show');
      } else {
        $('#back-top').removeClass('show');
      }
    });
    $('#back-top').on('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    //>> Search Popup Start <<//
    const $searchWrap = $('.search-wrap');
    const $navSearch = $('.nav-search');
    const $searchClose = $('#search-close');

    $('.search-trigger').on('click', function (e) {
      e.preventDefault();

      $searchWrap.animate({ opacity: 'toggle' }, 500, function () {
        // Focus input AFTER the popup is visible
        const $input = $('.main-search-input');
        if ($input.length) $input.trigger('focus');
      });

      $navSearch.add($searchClose).addClass('open');
    });

    $('.search-close').on('click', function (e) {
      e.preventDefault();
      $searchWrap.animate({ opacity: 'toggle' }, 500);
      $navSearch.add($searchClose).removeClass('open');
    });

    function closeSearch() {
      $searchWrap.fadeOut(200);
      $navSearch.add($searchClose).removeClass('open');
    }

    $(document.body).on('click', function (e) {
      closeSearch();
    });

    $('.search-trigger, .main-search-input').on('click', function (e) {
      e.stopPropagation();
    });

    //>> Mouse Cursor Start <<//
    function mousecursor() {
      if ($('body')) {
        const e = document.querySelector('.cursor-inner'),
          t = document.querySelector('.cursor-outer');
        let n,
          i = 0,
          o = !1;
        ((window.onmousemove = function (s) {
          (o || (t.style.transform = 'translate(' + s.clientX + 'px, ' + s.clientY + 'px)'),
            (e.style.transform = 'translate(' + s.clientX + 'px, ' + s.clientY + 'px)'),
            (n = s.clientY),
            (i = s.clientX));
        }),
          $('body').on('mouseenter', 'a, .cursor-pointer', function () {
            (e.classList.add('cursor-hover'), t.classList.add('cursor-hover'));
          }),
          $('body').on('mouseleave', 'a, .cursor-pointer', function () {
            ($(this).is('a') && $(this).closest('.cursor-pointer').length) ||
              (e.classList.remove('cursor-hover'), t.classList.remove('cursor-hover'));
          }),
          (e.style.visibility = 'visible'),
          (t.style.visibility = 'visible'));
      }
    }
    $(function () {
      mousecursor();
    });

    // auto
    // auto open accordion item
    // Auto-open FAQ accordion if arriving with a hash (e.g. faq.html#faqGeneral5)
    (function openFaqFromHash() {
      const hash = window.location.hash;
      if (!hash) return;

      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      // Open the collapse
      if (window.bootstrap && window.bootstrap.Collapse) {
        try {
          const inst = window.bootstrap.Collapse.getOrCreateInstance(target, { toggle: false });
          inst.show();
        } catch (e) {}
      } else {
        target.classList.add('show');
      }

      // Update the corresponding button (if present)
      const btn = document.querySelector(`[data-bs-target="#${CSS.escape(id)}"]`);
      if (btn) {
        btn.classList.remove('collapsed');
        btn.setAttribute('aria-expanded', 'true');
      }

      // Scroll to the accordion ITEM (not just the panel)
      const item = btn?.closest('.accordion-item') || target;
      setTimeout(() => {
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    })();

    // =========================================================
    // Compare table toggles (GLOBAL / reusable)
    // - Works for pricing page + rapid response page + any future page
    // - Avoids smooth-scroll / anchor handlers hijacking clicks
    // - Uses ONE handler only (no overlaps)
    // =========================================================
    (function () {
      document.addEventListener(
        'click',
        function (e) {
          const btn = e.target.closest('.compare-toggle-btn');
          if (!btn) return;

          const area = btn.closest('.pricing-compare-area');
          if (!area) return;

          // Prevent anchor scroll + block other handlers from hijacking
          e.preventDefault();
          e.stopPropagation();

          const isOpen = area.classList.toggle('is-open');

          // Support collapses implemented via [hidden]
          const collapse = area.querySelector('.pricing-compare-collapse');
          if (collapse && collapse.hasAttribute('hidden')) {
            if (isOpen) collapse.removeAttribute('hidden');
            else collapse.setAttribute('hidden', '');
          }

          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        },
        true // capture phase beats smooth-scroll scripts
      );
    })();

    // =========================================================
    // Company size cycler -> updates package pricing
    // - UI: arrows cycle sizes
    // - Pricing: scales .pkg-price[data-base] by multiplier
    // =========================================================
    (function () {
      function formatMoney(n) {
        return '$' + Math.round(n).toLocaleString('en-US');
      }

      function initCompanySizeCycler() {
        var root = document.querySelector('[data-size-cycler]');
        if (!root) return; // not on this page

        var btnPrev = root.querySelector('.pricing-size-btn.is-prev');
        var btnNext = root.querySelector('.pricing-size-btn.is-next');
        var valueEl = root.querySelector('.pricing-size-value');
        var hiddenInput = root.querySelector('#pkgCompanySize');

        // Define sizes here (label + multiplier)
        var SIZES = [
          { label: '1–10 employees', mult: 1 },
          { label: '11–30 employees', mult: 1.35 },
          { label: '31–75 employees', mult: 1.75 },
          { label: '76–150 employees', mult: 2.4 },
          { label: '151+ employees', mult: null }, // Custom
        ];

        // Pricing targets
        var priceEls = Array.from(document.querySelectorAll('.pkg-price[data-base]'));
        var subnoteEls = Array.from(document.querySelectorAll('.pkg-size-subnote'));

        function setIndex(nextIndex) {
          if (nextIndex < 0) nextIndex = SIZES.length - 1;
          if (nextIndex >= SIZES.length) nextIndex = 0;

          var item = SIZES[nextIndex];
          root.dataset.sizeIndex = String(nextIndex);

          // Update label
          if (valueEl) valueEl.textContent = item.label;

          // Store label for forms/links
          if (hiddenInput) hiddenInput.value = item.label;

          // Update pricing
          if (item.mult == null) {
            // Custom
            priceEls.forEach(function (el) {
              var base = Number(el.getAttribute('data-base') || '0');
              if (!base) return;
              el.textContent = 'Custom';
            });
            subnoteEls.forEach(function (el) {
              el.textContent = '151+ people — scoped quote';
            });
          } else {
            priceEls.forEach(function (el) {
              var base = Number(el.getAttribute('data-base') || '0');
              if (!base) return;
              el.textContent = formatMoney(base * item.mult);
            });
            subnoteEls.forEach(function (el) {
              el.textContent = 'Estimated for ' + item.label;
            });
          }
        }

        function getIndex() {
          var n = parseInt(root.dataset.sizeIndex || '0', 10);
          return isNaN(n) ? 0 : n;
        }

        if (btnPrev) {
          btnPrev.addEventListener('click', function () {
            setIndex(getIndex() - 1);
          });
        }

        if (btnNext) {
          btnNext.addEventListener('click', function () {
            setIndex(getIndex() + 1);
          });
        }

        // Init default index 0
        setIndex(0);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCompanySizeCycler);
      } else {
        initCompanySizeCycler();
      }
    })();
  }); // End Document Ready Function

  function loader() {
    $(window).on('load', function () {
      // Animate loader off screen
      $('.preloader').addClass('loaded');
      $('.preloader').delay(600).fadeOut();
    });
  }

  loader();
})(jQuery); // End jQuery
