/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JavaLibrariesToLookFor = exports.MavenArtifactIdRegex = exports.MavenGroupIdRegex = exports.MavenDependencyRegex = exports.MavenDependenciesRegex = exports.GradleDependencyCompactRegex = exports.GradleDependencyLooseRegex = void 0;
    exports.GradleDependencyLooseRegex = /group\s*:\s*[\'\"](.*?)[\'\"]\s*,\s*name\s*:\s*[\'\"](.*?)[\'\"]\s*,\s*version\s*:\s*[\'\"](.*?)[\'\"]/g;
    exports.GradleDependencyCompactRegex = /[\'\"]([^\'\"\s]*?)\:([^\'\"\s]*?)\:([^\'\"\s]*?)[\'\"]/g;
    exports.MavenDependenciesRegex = /<dependencies>([\s\S]*?)<\/dependencies>/g;
    exports.MavenDependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    exports.MavenGroupIdRegex = /<groupId>([\s\S]*?)<\/groupId>/;
    exports.MavenArtifactIdRegex = /<artifactId>([\s\S]*?)<\/artifactId>/;
    exports.JavaLibrariesToLookFor = [
        // azure mgmt sdk
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure' && artifactId === 'azure', 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure' && artifactId.startsWith('azure-mgmt-'), 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId.startsWith('com.microsoft.azure') && artifactId.startsWith('azure-mgmt-'), 'tag': 'azure' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.resourcemanager' && artifactId.startsWith('azure-resourcemanager'), 'tag': 'azure' }, // azure track2 sdk
        // java ee
        { 'predicate': (groupId, artifactId) => groupId === 'javax' && artifactId === 'javaee-api', 'tag': 'javaee' },
        { 'predicate': (groupId, artifactId) => groupId === 'javax.xml.bind' && artifactId === 'jaxb-api', 'tag': 'javaee' },
        // jdbc
        { 'predicate': (groupId, artifactId) => groupId === 'mysql' && artifactId === 'mysql-connector-java', 'tag': 'jdbc' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.sqlserver' && artifactId === 'mssql-jdbc', 'tag': 'jdbc' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.oracle.database.jdbc' && artifactId.startsWith('ojdbc'), 'tag': 'jdbc' },
        // jpa
        { 'predicate': (groupId, artifactId) => groupId === 'org.hibernate', 'tag': 'jpa' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.eclipse.persistence' && artifactId === 'eclipselink', 'tag': 'jpa' },
        // lombok
        { 'predicate': (groupId, artifactId) => groupId === 'org.projectlombok', 'tag': 'lombok' },
        // redis
        { 'predicate': (groupId, artifactId) => groupId === 'org.springframework.data' && artifactId === 'spring-data-redis', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'redis.clients' && artifactId === 'jedis', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.redisson', 'tag': 'redis' },
        { 'predicate': (groupId, artifactId) => groupId === 'io.lettuce' && artifactId === 'lettuce-core', 'tag': 'redis' },
        // spring boot
        { 'predicate': (groupId, artifactId) => groupId === 'org.springframework.boot', 'tag': 'springboot' },
        // sql
        { 'predicate': (groupId, artifactId) => groupId === 'org.jooq', 'tag': 'sql' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.mybatis', 'tag': 'sql' },
        // unit test
        { 'predicate': (groupId, artifactId) => groupId === 'org.junit.jupiter' && artifactId === 'junit-jupiter-api', 'tag': 'unitTest' },
        { 'predicate': (groupId, artifactId) => groupId === 'junit' && artifactId === 'junit', 'tag': 'unitTest' },
        { 'predicate': (groupId, artifactId) => groupId === 'org.testng' && artifactId === 'testng', 'tag': 'unitTest' },
        // cosmos
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.includes('cosmos'), 'tag': 'azure-cosmos' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('cosmos'), 'tag': 'azure-cosmos' },
        // storage account
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.includes('azure-storage'), 'tag': 'azure-storage' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('storage'), 'tag': 'azure-storage' },
        // service bus
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId === 'azure-messaging-servicebus', 'tag': 'azure-servicebus' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('servicebus'), 'tag': 'azure-servicebus' },
        // event hubs
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId.startsWith('azure-messaging-eventhubs'), 'tag': 'azure-eventhubs' },
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure.spring' && artifactId.includes('eventhubs'), 'tag': 'azure-eventhubs' },
        // open ai
        { 'predicate': (groupId, artifactId) => groupId === 'com.theokanning.openai-gpt3-java', 'tag': 'openai' },
        // azure open ai
        { 'predicate': (groupId, artifactId) => groupId === 'com.azure' && artifactId === 'azure-ai-openai', 'tag': 'azure-openai' },
        // Azure Functions
        { 'predicate': (groupId, artifactId) => groupId === 'com.microsoft.azure.functions' && artifactId === 'azure-functions-java-library', 'tag': 'azure-functions' },
        // quarkus
        { 'predicate': (groupId, artifactId) => groupId === 'io.quarkus', 'tag': 'quarkus' },
        // microprofile
        { 'predicate': (groupId, artifactId) => groupId.startsWith('org.eclipse.microprofile'), 'tag': 'microprofile' },
        // micronaut
        { 'predicate': (groupId, artifactId) => groupId === 'io.micronaut', 'tag': 'micronaut' },
        // GraalVM
        { 'predicate': (groupId, artifactId) => groupId.startsWith('org.graalvm'), 'tag': 'graalvm' }
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YVdvcmtzcGFjZVRhZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RhZ3MvY29tbW9uL2phdmFXb3Jrc3BhY2VUYWdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVuRixRQUFBLDBCQUEwQixHQUFHLHlHQUF5RyxDQUFDO0lBQ3ZJLFFBQUEsNEJBQTRCLEdBQUcsMERBQTBELENBQUM7SUFFMUYsUUFBQSxzQkFBc0IsR0FBRywyQ0FBMkMsQ0FBQztJQUNyRSxRQUFBLG9CQUFvQixHQUFHLHVDQUF1QyxDQUFDO0lBQy9ELFFBQUEsaUJBQWlCLEdBQUcsZ0NBQWdDLENBQUM7SUFDckQsUUFBQSxvQkFBb0IsR0FBRyxzQ0FBc0MsQ0FBQztJQUU5RCxRQUFBLHNCQUFzQixHQUFtRjtRQUNySCxpQkFBaUI7UUFDakIsRUFBRSxXQUFXLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEtBQUsscUJBQXFCLElBQUksVUFBVSxLQUFLLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO1FBQ3JILEVBQUUsV0FBVyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsT0FBTyxLQUFLLHFCQUFxQixJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtRQUNuSSxFQUFFLFdBQVcsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7UUFDM0ksRUFBRSxXQUFXLEVBQUUsQ0FBQyxPQUFP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