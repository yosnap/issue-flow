/**
 * @fileoverview Vue Plugin for IssueFlow
 * 
 * Provides global installation and configuration for IssueFlow
 * in Vue 3 applications.
 */

import type { App, Plugin } from 'vue';
import { provide, reactive, readonly } from 'vue';
import { IssueFlowWidget } from '../components';
import { useIssueFlow } from '../composables/useIssueFlow';
import type { 
  IssueFlowConfig,
  IssueFlowPluginOptions,
  ISSUEFLOW_CONFIG_KEY,
  ISSUEFLOW_SERVICE_KEY
} from '../types';

/**
 * IssueFlow Vue Plugin
 */
export const IssueFlowPlugin: Plugin<IssueFlowPluginOptions> = {
  install(app: App, options: IssueFlowPluginOptions) {
    const { config, components = {}, router, store } = options;
    
    // Create global service instance
    const service = useIssueFlow({
      config,
      autoInit: true,
      devtools: true,
    });
    
    // Provide globally
    app.provide(ISSUEFLOW_CONFIG_KEY, readonly(reactive({ value: config })));
    app.provide(ISSUEFLOW_SERVICE_KEY, service);
    
    // Register components
    const prefix = components.prefix || 'If';
    const shouldRegister = components.global !== false;
    
    if (shouldRegister) {
      // Register main widget component
      if (!components.exclude?.includes('IssueFlowWidget')) {
        app.component(`${prefix}Widget`, IssueFlowWidget);
      }
      
      // Register additional components if included
      if (components.include?.includes('IssueFlowForm')) {
        // Dynamic import to avoid circular dependencies
        import('../components/IssueFlowForm.vue').then(({ IssueFlowForm }) => {
          app.component(`${prefix}Form`, IssueFlowForm);
        });
      }
      
      if (components.include?.includes('IssueFlowList')) {
        import('../components/IssueFlowList.vue').then(({ IssueFlowList }) => {
          app.component(`${prefix}List`, IssueFlowList);
        });
      }
      
      if (components.include?.includes('IssueFlowTrigger')) {
        import('../components/IssueFlowTrigger.vue').then(({ IssueFlowTrigger }) => {
          app.component(`${prefix}Trigger`, IssueFlowTrigger);
        });
      }
    }
    
    // Router integration
    if (router?.enabled && app.config.globalProperties.$router) {
      const vueRouter = app.config.globalProperties.$router;
      
      // Add admin route if specified
      if (router.adminRoute) {
        vueRouter.addRoute({
          path: router.adminRoute,
          name: 'issueflow-admin',
          component: () => import('../components/IssueFlowAdmin.vue'),
          meta: { requiresAuth: true },
        });
      }
      
      // Add navigation guard for error tracking
      vueRouter.beforeEach((to, from) => {
        service.updateConfig({
          user: {
            metadata: {
              currentRoute: to.path,
              previousRoute: from.path,
            },
          },
        });
      });
    }
    
    // Store integration (Vuex or Pinia)
    if (store?.enabled && app.config.globalProperties.$store) {
      const vuexStore = app.config.globalProperties.$store;
      const moduleName = store.moduleName || 'issueflow';
      
      // Register Vuex module
      vuexStore.registerModule(moduleName, {
        namespaced: true,
        state: () => ({
          config: config,
          isLoading: false,
          error: null,
          user: null,
          issues: [],
          isWidgetOpen: false,
        }),
        mutations: {
          SET_CONFIG(state, payload) {
            state.config = payload;
          },
          SET_LOADING(state, payload) {
            state.isLoading = payload;
          },
          SET_ERROR(state, payload) {
            state.error = payload;
          },
          SET_USER(state, payload) {
            state.user = payload;
          },
          SET_ISSUES(state, payload) {
            state.issues = payload;
          },
          SET_WIDGET_OPEN(state, payload) {
            state.isWidgetOpen = payload;
          },
        },
        actions: {
          async initialize({ commit }, config) {
            commit('SET_LOADING', true);
            try {
              await service.initialize(config);
              commit('SET_CONFIG', config);
              commit('SET_ERROR', null);
            } catch (error) {
              commit('SET_ERROR', error);
              throw error;
            } finally {
              commit('SET_LOADING', false);
            }
          },
          async submitIssue({ commit }, issue) {
            commit('SET_LOADING', true);
            try {
              const result = await service.submitIssue(issue);
              commit('SET_ERROR', null);
              return result;
            } catch (error) {
              commit('SET_ERROR', error);
              throw error;
            } finally {
              commit('SET_LOADING', false);
            }
          },
          openWidget({ commit }) {
            commit('SET_WIDGET_OPEN', true);
            service.openWidget();
          },
          closeWidget({ commit }) {
            commit('SET_WIDGET_OPEN', false);
            service.closeWidget();
          },
        },
        getters: {
          isInitialized: () => service.isInitialized.value,
          hasError: (state) => state.error !== null,
          totalIssues: (state) => state.issues.length,
        },
      });
    }
    
    // Add global properties
    app.config.globalProperties.$issueflow = service;
    app.config.globalProperties.$issueflowConfig = config;
    
    // Add global error handler
    const originalErrorHandler = app.config.errorHandler;
    app.config.errorHandler = (err, instance, info) => {
      // Log to IssueFlow if configured
      if (config.behavior?.captureConsoleErrors) {
        service.submitIssue({
          title: `Vue Error: ${err.message}`,
          description: `Error occurred in Vue application:\n\n${err.stack}\n\nComponent: ${info}`,
          type: 'bug',
          priority: 'high',
          metadata: {
            errorType: 'vue-error',
            componentInfo: info,
            stack: err.stack,
          },
        }).catch(console.error);
      }
      
      // Call original error handler if exists
      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info);
      } else {
        console.error(err);
      }
    };
    
    // DevTools integration
    if (config.vue?.devtools !== false && typeof window !== 'undefined') {
      setupDevTools(app, service, config);
    }
    
    console.log('[IssueFlow Vue] Plugin installed successfully');
  },
};

/**
 * Setup Vue DevTools integration
 */
function setupDevTools(app: App, service: any, config: IssueFlowConfig): void {
  const devtools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
  
  if (!devtools) return;
  
  // Register custom inspector
  devtools.on('app:init', () => {
    devtools.addInspector({
      id: 'issueflow',
      label: 'IssueFlow',
      icon: 'feedback',
      treeFilterPlaceholder: 'Search issues...',
      stateFilterPlaceholder: 'Filter state...',
    });
    
    devtools.on('issueflow:selected', (payload) => {
      devtools.sendInspectorState('issueflow', {
        state: {
          config: config,
          service: {
            isInitialized: service.isInitialized.value,
            isLoading: service.isLoading.value,
            hasError: service.hasError.value,
            totalIssues: service.totalIssues.value,
          },
        },
      });
    });
  });
  
  // Add timeline events
  devtools.on('issueflow:timeline', () => {
    devtools.addTimelineLayer({
      id: 'issueflow',
      label: 'IssueFlow',
      color: 0x3b82f6,
    });
  });
  
  // Track issue submissions
  service.issueSubmitted?.subscribe?.((result: any) => {
    devtools.addTimelineEvent({
      layerId: 'issueflow',
      event: {
        time: Date.now(),
        title: 'Issue Submitted',
        data: {
          issue: result.issue,
        },
      },
    });
  });
}

/**
 * Create IssueFlow plugin with configuration
 */
export function createIssueFlow(config: IssueFlowConfig): Plugin {
  return {
    install(app: App) {
      IssueFlowPlugin.install(app, { config });
    },
  };
}