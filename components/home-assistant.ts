import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export class HomeAssistant extends pulumi.ComponentResource {
    private readonly version: string;

    constructor(name: string, args = {}, opts?: pulumi.ResourceOptions) {
        super('orangelab:apps:HomeAssistant', name, args, opts);

        const config = new pulumi.Config('home-assistant');
        this.version = config.require('version');

        // https://artifacthub.io/packages/helm/helm-hass/home-assistant
        new kubernetes.helm.v3.Release(
            name,
            {
                chart: 'home-assistant',
                namespace: 'home-assistant',
                createNamespace: true,
                version: this.version,
                repositoryOpts: {
                    repo: 'http://pajikos.github.io/home-assistant-helm-chart/',
                },
                values: {
                    hostNetwork: true,
                    ingress: {
                        enabled: true,
                        className: 'tailscale',
                        hosts: [
                            {
                                host: 'home-assistant',
                                paths: [
                                    {
                                        path: '/',
                                        pathType: 'ImplementationSpecific',
                                    },
                                ],
                            },
                        ],
                        tls: [
                            {
                                hosts: ['home-assistant'],
                            },
                        ],
                    },
                    configuration: {
                        enabled: true,
                        trusted_proxies: ['10.42.0.0/16', '127.0.0.0/8'],
                    },
                    persistence: {
                        enabled: true,
                        accessMode: 'ReadWriteOnce',
                        size: '5Gi',
                    },
                },
            },
            { parent: this },
        );

        this.registerOutputs();
    }
}