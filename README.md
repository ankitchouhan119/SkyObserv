kubectl port-forward svc/elasticsearch 9200:9200




docker run -d --name skywalking-oap-local \
  --network host \
  -e SW_STORAGE=elasticsearch \
  -e SW_STORAGE_ES_CLUSTER_NODES=127.0.0.1:9200 \
  -e JAVA_OPTS="-Xms1g -Xmx1g" \
  apache/skywalking-oap-server:10.0.0



  cd /home/ankit119/Downloads/apache-skywalking-java-agent-9.5.0-src/apache-skywalking-java-agent-9.5.0/skywalking-agent

  java -javaagent:skywalking-agent1.jar \
-Dskywalking.agent.service_name=online-bookstore \
-Dskywalking.collector.backend_service=localhost:11800 \
-jar webapp-runner.jar onlinebookstore.war