/*
 * Copyright 2014 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


package co.cask.cdap.security.authentication.client.basic.handlers;

import org.apache.http.HttpException;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.RequestLine;
import org.apache.http.protocol.HttpContext;
import org.apache.http.protocol.HttpRequestHandler;

import java.io.IOException;
import javax.ws.rs.HttpMethod;

public class AuthDisabledHandler implements HttpRequestHandler {

  @Override
  public void handle(HttpRequest httpRequest, HttpResponse response, HttpContext httpContext)
    throws HttpException, IOException {

    RequestLine requestLine = httpRequest.getRequestLine();
    String method = requestLine.getMethod();
    int statusCode;
    if (HttpMethod.GET.equals(method)) {
      statusCode = HttpStatus.SC_OK;
    } else {
      statusCode = HttpStatus.SC_NOT_IMPLEMENTED;
    }
    response.setStatusCode(statusCode);
  }
}
