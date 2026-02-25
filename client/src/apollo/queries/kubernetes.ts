import { gql } from '@apollo/client';

export const GET_K8S_DASHBOARD = gql`
  query queryK8sDashboard {
    clusters: listServices(layer: "K8S") { id name layers }
    nodes: listServices(layer: "K8S_NODE") { id name layers }
    services: listServices(layer: "K8S_SERVICE") { id name layers }
  }
`;

export const GET_K8S_NODES = gql`
  query queryK8sNodes($duration: Duration!) {
    allServices: getAllServices(duration: $duration) {
      id name layers normal
    }
  }
`;

export const GET_SERVICE_INSTANCES = gql`
  query queryInstances($serviceId: ID!, $duration: Duration!) {
    instances: listInstances(serviceId: $serviceId, duration: $duration) {
      id name attributes { name value }
    }
  }
`;

export const GET_INSTANCE_DETAIL = gql`
  query queryInstanceDetail($instanceId: String!) {
    instance: getInstance(instanceId: $instanceId) {
      id name attributes { name value }
    }
  }
`;

export const GET_EVENTS = gql`
  query queryEvents($condition: EventQueryCondition!) {
    events: queryEvents(condition: $condition) {
      events {
        name type message startTime endTime
      }
    }
  }
`;

export const GET_NODE_METRICS = gql`
  query queryNodeMetrics($serviceName: String!, $duration: Duration!) {
    cpu: readMetricsValues(condition: {
      name: "k8s_node_cpu_usage"
      entity: { scope: K8S_NODE, serviceName: $serviceName, normal: true }
      duration: $duration
    }) { values { value } }
    memory: readMetricsValues(condition: {
      name: "k8s_node_memory_usage"
      entity: { scope: K8S_NODE, serviceName: $serviceName, normal: true }
      duration: $duration
    }) { values { value } }
  }
`;

export const GET_NODE_INSTANCES = gql`
  query queryNodeInstances($serviceId: ID!, $duration: Duration!) {
    instances: getServiceInstances(serviceId: $serviceId, duration: $duration) {
      id name instanceUUID attributes { name value }
    }
  }
`;


// export const GET_MQE_METRICS = gql`
//   query execMQE($expression: String!, $entity: Entity!, $duration: Duration!) {
//     result: execExpression(expression: $expression, entity: $entity, duration: $duration) {
//       results { values { id value } }
//       error
//     }
//   }
// `;



export const GET_MQE_METRICS = gql`
  query execMQE($expression: String!, $entity: Entity!, $duration: Duration!) {
    result: execExpression(expression: $expression, entity: $entity, duration: $duration) {
      results { 
        metric { 
          labels { 
            key 
            value 
          } 
        } 
        values { 
          id 
          value 
        } 
      }
      error
    }
  }
`;